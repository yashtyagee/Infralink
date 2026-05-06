import pandas as pd
from io import StringIO

async def parse_csv(file):
    content = await file.read()
    df = pd.read_csv(StringIO(content.decode('utf-8')))
    df = df.replace({pd.NA: None, float('nan'): None})
    return df.where(pd.notnull(df), None).to_dict('records')