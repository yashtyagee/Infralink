from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from app.models.database import get_db, UBIDProfile, BusinessRecord, Event, AuditLog
from datetime import datetime
import csv
import io

router = APIRouter()


# ─────────────────────────────────────────────────────────────
#  HELPER: build an HTML report page (acts as our "PDF")
# ─────────────────────────────────────────────────────────────

def _html_wrapper(title: str, body_html: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{title}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a14; color: #e2e8f0; padding: 40px; }}
    h1   {{ font-size: 1.8rem; color: #7cff67; margin-bottom: 6px; }}
    .meta {{ font-size: 0.8rem; color: #64748b; margin-bottom: 32px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.85rem; }}
    th {{ background: #1a1a2e; color: #7cff67; padding: 10px 14px; text-align: left; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; }}
    td {{ padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }}
    tr:hover td {{ background: rgba(124,255,103,0.04); }}
    .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }}
    .high   {{ background: rgba(239,68,68,0.15);  color: #ef4444; }}
    .medium {{ background: rgba(245,158,11,0.15); color: #f59e0b; }}
    .low    {{ background: rgba(34,197,94,0.15);  color: #22c55e; }}
    .active {{ background: rgba(124,255,103,0.12); color: #7cff67; }}
    .footer {{ margin-top: 40px; font-size: 0.75rem; color: #334155; text-align: center; }}
    @media print {{ body {{ background: white; color: black; }} th {{ background: #f1f5f9; color: #1e293b; }} }}
  </style>
</head>
<body>
  <h1>📊 {title}</h1>
  <div class="meta">Generated: {now} &nbsp;|&nbsp; EntityNet Platform by Infralink</div>
  {body_html}
  <div class="footer">Infralink EntityNet — Confidential Report &nbsp;|&nbsp; {now}</div>
</body>
</html>"""


# ─────────────────────────────────────────────────────────────
#  ENTITIES — CSV
# ─────────────────────────────────────────────────────────────

@router.get("/api/export/entities/csv")
async def export_entities_csv(db: Session = Depends(get_db)):
    """Download all UBID profiles as a CSV file."""
    profiles = db.query(UBIDProfile).order_by(UBIDProfile.canonical_name).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "UBID", "Canonical Name", "Status", "Anchor Type", "Anchor Value",
        "Risk Score", "Source Departments", "Total Records",
        "Created At", "Updated At"
    ])

    for p in profiles:
        depts = ", ".join(p.source_departments) if p.source_departments else ""
        record_count = len(p.record_ids) if p.record_ids else 0
        writer.writerow([
            p.ubid,
            p.canonical_name,
            p.status,
            p.anchor_type or "",
            p.anchor_value or "",
            int(p.risk_score or 0),
            depts,
            record_count,
            p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
            p.updated_at.strftime("%Y-%m-%d %H:%M") if p.updated_at else "",
        ])

    output.seek(0)
    filename = f"entities_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─────────────────────────────────────────────────────────────
#  ENTITIES — HTML REPORT (PDF-style)
# ─────────────────────────────────────────────────────────────

@router.get("/api/export/entities/pdf")
async def export_entities_pdf(db: Session = Depends(get_db)):
    """Download all UBID profiles as a printable HTML report."""
    profiles = db.query(UBIDProfile).order_by(UBIDProfile.canonical_name).all()

    rows_html = ""
    for p in profiles:
        depts = ", ".join(p.source_departments) if p.source_departments else "—"
        record_count = len(p.record_ids) if p.record_ids else 0
        risk = int(p.risk_score or 0)
        risk_class = "high" if risk >= 70 else "medium" if risk >= 40 else "low"
        status_class = "active" if p.status == "ACTIVE" else ""
        rows_html += f"""<tr>
          <td style="font-family:monospace;font-size:0.78rem;color:#7cff67">{p.ubid}</td>
          <td><strong>{p.canonical_name or '—'}</strong></td>
          <td><span class="badge {status_class}">{p.status}</span></td>
          <td>{p.anchor_type or '—'}: {p.anchor_value or '—'}</td>
          <td>{depts}</td>
          <td>{record_count}</td>
          <td><span class="badge {risk_class}">{risk}</span></td>
        </tr>"""

    body = f"""
    <p style="margin-bottom:16px;color:#64748b">{len(profiles)} unified business profiles found in the registry.</p>
    <table>
      <thead><tr>
        <th>UBID</th><th>Canonical Name</th><th>Status</th>
        <th>Anchor ID</th><th>Departments</th><th>Records</th><th>Risk</th>
      </tr></thead>
      <tbody>{rows_html}</tbody>
    </table>"""

    html = _html_wrapper("Entity Registry Report", body)
    filename = f"entities_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.html"

    return Response(
        content=html,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─────────────────────────────────────────────────────────────
#  ANOMALIES — CSV
# ─────────────────────────────────────────────────────────────

@router.get("/api/export/anomalies/csv")
async def export_anomalies_csv(db: Session = Depends(get_db)):
    """Download all high-risk profiles and their anomalies as CSV."""
    profiles = db.query(UBIDProfile).filter(
        UBIDProfile.risk_score > 0
    ).order_by(UBIDProfile.risk_score.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "UBID", "Canonical Name", "Status", "Risk Score", "Risk Level",
        "Anomaly Type", "Anomaly Detail", "Detected At", "Source Departments"
    ])

    for p in profiles:
        risk = int(p.risk_score or 0)
        risk_level = "HIGH" if risk >= 70 else "MEDIUM" if risk >= 40 else "LOW"
        depts = ", ".join(p.source_departments) if p.source_departments else ""

        # Get anomaly audit logs
        anomaly_logs = db.query(AuditLog).filter(
            AuditLog.entity_id == p.ubid,
            AuditLog.action.like("ANOMALY_DETECTED%")
        ).order_by(AuditLog.created_at.desc()).all()

        if anomaly_logs:
            for log in anomaly_logs:
                d = log.details or {}
                writer.writerow([
                    p.ubid, p.canonical_name, p.status, risk, risk_level,
                    d.get("type", "General Risk"),
                    d.get("details", ""),
                    log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else "",
                    depts
                ])
        else:
            writer.writerow([
                p.ubid, p.canonical_name, p.status, risk, risk_level,
                "General Risk", "Run scanner for detailed breakdown", "", depts
            ])

    output.seek(0)
    filename = f"anomaly_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─────────────────────────────────────────────────────────────
#  ANOMALIES — HTML REPORT (PDF-style)
# ─────────────────────────────────────────────────────────────

@router.get("/api/export/anomalies/pdf")
async def export_anomalies_pdf(db: Session = Depends(get_db)):
    """Download a styled anomaly risk report as printable HTML."""
    profiles = db.query(UBIDProfile).filter(
        UBIDProfile.risk_score > 0
    ).order_by(UBIDProfile.risk_score.desc()).all()

    rows_html = ""
    for p in profiles:
        risk = int(p.risk_score or 0)
        risk_class = "high" if risk >= 70 else "medium" if risk >= 40 else "low"
        depts = ", ".join(p.source_departments) if p.source_departments else "—"

        # Get top anomaly
        top_log = db.query(AuditLog).filter(
            AuditLog.entity_id == p.ubid,
            AuditLog.action.like("ANOMALY_DETECTED%")
        ).order_by(AuditLog.created_at.desc()).first()

        if top_log and top_log.details:
            anomaly_type = top_log.details.get("type", "General Risk")
            anomaly_detail = top_log.details.get("details", "")
        else:
            anomaly_type = "Pending Scan"
            anomaly_detail = "Run the Risk Scanner to get details"

        rows_html += f"""<tr>
          <td style="font-family:monospace;font-size:0.78rem;color:#7cff67">{p.ubid}</td>
          <td><strong>{p.canonical_name or '—'}</strong></td>
          <td><span class="badge {risk_class}">{risk}</span></td>
          <td><span class="badge {risk_class}">{anomaly_type}</span></td>
          <td style="font-size:0.8rem;color:#94a3b8">{anomaly_detail}</td>
          <td>{depts}</td>
        </tr>"""

    # Summary stats
    high_count = sum(1 for p in profiles if p.risk_score >= 70)
    med_count  = sum(1 for p in profiles if 40 <= p.risk_score < 70)
    low_count  = sum(1 for p in profiles if 0 < p.risk_score < 40)

    body = f"""
    <div style="display:flex;gap:24px;margin-bottom:32px">
      <div style="background:#1a0a0a;border:1px solid #ef444433;border-radius:12px;padding:16px 24px;flex:1">
        <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">High Risk</div>
        <div style="font-size:2rem;font-weight:700;color:#ef4444">{high_count}</div>
      </div>
      <div style="background:#1a1200;border:1px solid #f59e0b33;border-radius:12px;padding:16px 24px;flex:1">
        <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Medium Risk</div>
        <div style="font-size:2rem;font-weight:700;color:#f59e0b">{med_count}</div>
      </div>
      <div style="background:#0a1a0a;border:1px solid #22c55e33;border-radius:12px;padding:16px 24px;flex:1">
        <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Low Risk</div>
        <div style="font-size:2rem;font-weight:700;color:#22c55e">{low_count}</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>UBID</th><th>Business Name</th><th>Risk Score</th>
        <th>Anomaly Type</th><th>Detail</th><th>Departments</th>
      </tr></thead>
      <tbody>{rows_html}</tbody>
    </table>"""

    html = _html_wrapper("Anomaly & Risk Intelligence Report", body)
    filename = f"anomaly_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.html"

    return Response(
        content=html,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─────────────────────────────────────────────────────────────
#  FAVICON — suppress 404 log noise
# ─────────────────────────────────────────────────────────────

@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)
