import re

def normalize_business_name(name: str) -> str:
    # Remove special characters
    name = re.sub(r'[^\w\s]', ' ', name)
    # Lowercase
    name = name.lower()
    # Remove common suffixes
    suffixes = ['pvt', 'ltd', 'private', 'limited', 'llp']
    for suffix in suffixes:
        name = re.sub(rf'\b{suffix}\b', '', name)
    # Remove extra spaces
    name = ' '.join(name.split())
    return name