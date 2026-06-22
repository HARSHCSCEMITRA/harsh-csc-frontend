from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import sys

print("Python version:", sys.version)

opts = Options()
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_argument('--window-size=1280,900')
opts.add_argument('--disable-blink-features=AutomationControlled')
opts.add_argument('--remote-debugging-port=0')
opts.add_argument('--disable-background-networking')
opts.add_argument('--disable-client-side-phishing-detection')
opts.add_argument('--disable-default-apps')
opts.add_argument('--no-first-run')
opts.add_argument('--disable-hang-monitor')
opts.add_argument('--disable-popup-blocking')
opts.add_argument('--disable-prompt-on-repost')
opts.add_argument('--disable-sync')
opts.add_argument('--disable-translate')
opts.add_argument('--metrics-recording-only')
opts.add_argument('--safebrowsing-disable-auto-update')
opts.add_argument('--ignore-certificate-errors')
opts.add_argument('--allow-insecure-localhost')
opts.add_argument('--log-level=3')
opts.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
opts.add_experimental_option('useAutomationExtension', False)

try:
    print("Installing chromedriver...")
    driver_path = ChromeDriverManager().install()
    print("Driver path:", driver_path)
    svc = Service(executable_path=driver_path)
    print("Launching Chrome...")
    driver = webdriver.Chrome(service=svc, options=opts)
    print("Chrome launched successfully!")
    driver.quit()
except Exception as e:
    print("Launch failed with error:")
    print(e)
