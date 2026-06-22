import urllib.request
import ssl

url = "https://apnakhata.rajasthan.gov.in/qr.aspx?usn=3023938172100662928"

# Ignore SSL verification issues just in case
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        html = response.read().decode('utf-8')
        print("Response HTML length:", len(html))
        # Print a portion of the response where we expect details (or search for khata/numbers)
        with open("qr_response.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved response to qr_response.html")
except Exception as e:
    print("Error fetching QR link:", str(e))
