const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup console listener before navigation
  const consoleMessages = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text, timestamp: Date.now() });
  });
  
  // Setup error listener
  page.on('pageerror', error => {
    console.log(`[Page Error] ${error.message}`);
    consoleMessages.push({ type: 'error', text: error.message, timestamp: Date.now() });
  });
  
  // Setup network error listener
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    networkErrors.push({ url, failure, timestamp: Date.now() });
    console.log(`[Network Error] ${url}: ${failure?.errorText || 'Unknown error'}`);
  });
  
  // Setup response listener to check for failed requests
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      networkErrors.push({ url, status: response.status(), timestamp: Date.now() });
      console.log(`[HTTP Error] ${url}: ${response.status()}`);
    }
  });
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8081/login');
    
    // Wait for page to load and React to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Screenshot saved to login-page.png');
    
    // Find and fill email field - try multiple selectors
    console.log('Looking for email field...');
    let emailInput = null;
    const emailSelectors = [
      'input[type="email"]',
      'input[placeholder*="אימייל"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]',
      'input[name*="email"]',
      'input[name*="Email"]',
      'input'
    ];
    
    for (const selector of emailSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          emailInput = inputs[0];
          console.log(`Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!emailInput) {
      // List all inputs
      const allInputs = await page.locator('input').all();
      console.log(`Total inputs found: ${allInputs.length}`);
      for (let i = 0; i < allInputs.length; i++) {
        const type = await allInputs[i].getAttribute('type');
        const placeholder = await allInputs[i].getAttribute('placeholder');
        console.log(`Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
      throw new Error('Email input not found');
    }
    
    console.log('Filling email field...');
    await emailInput.fill('harelzx41@gmail.com');
    
    // Find and fill password field
    console.log('Looking for password field...');
    let passwordInput = null;
    const passwordSelectors = [
      'input[type="password"]',
      'input[placeholder*="סיסמה"]',
      'input[placeholder*="password"]',
      'input[placeholder*="Password"]',
      'input[name*="password"]',
      'input[name*="Password"]'
    ];
    
    for (const selector of passwordSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          passwordInput = inputs[0];
          console.log(`Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!passwordInput) {
      throw new Error('Password input not found');
    }
    
    console.log('Filling password field...');
    await passwordInput.fill('123456');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-login.png', fullPage: true });
    console.log('Screenshot before login saved');
    
    // Find and click login button - try multiple selectors
    console.log('Looking for login button...');
    let loginButton = null;
    
    // Try different selectors - React Native Web uses divs, not buttons
    const selectors = [
      'div:has-text("התחברות")',
      'div:has-text("התחבר")',
      'button:has-text("התחבר")',
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("כניסה")',
      'div[class*="loginButton"]',
      'div[class*="button"]',
      'button',
      '[role="button"]',
      'a[href*="login"]'
    ];
    
    for (const selector of selectors) {
      try {
        const buttons = await page.locator(selector).all();
        console.log(`Found ${buttons.length} elements with selector: ${selector}`);
        if (buttons.length > 0) {
          loginButton = buttons[0];
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!loginButton) {
      // Get all clickable elements - React Native Web uses divs
      const allClickable = await page.locator('button, [role="button"], a, div[onclick], span[onclick], div[class*="button"], span[class*="button"], div:has-text("התחברות"), div:has-text("התחבר")').all();
      console.log(`Total clickable elements found: ${allClickable.length}`);
      for (let i = 0; i < Math.min(allClickable.length, 20); i++) {
        try {
          const text = await allClickable[i].textContent();
          const tag = await allClickable[i].evaluate(el => el.tagName);
          const className = await allClickable[i].getAttribute('class') || '';
          console.log(`Element ${i}: <${tag}> class="${className.substring(0, 50)}" text="${text?.substring(0, 50)}"`);
        } catch (e) {
          // Skip if can't get text
        }
      }
      
      // Try pressing Enter on password field as alternative
      console.log('Trying to submit by pressing Enter on password field...');
      await passwordInput.press('Enter');
      await page.waitForTimeout(2000);
    }
    
    if (loginButton) {
      console.log('Clicking login button...');
      // Scroll to button if needed
      await loginButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await loginButton.click({ force: true });
      console.log('Button clicked successfully');
    } else {
      console.log('No button found, already tried Enter key');
    }
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('Screenshot after login saved');
    
    // Wait a bit more to see any errors and network requests
    await page.waitForTimeout(5000);
    
    console.log('\n=== Console Messages Summary ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    
    // Show ALL console messages (not filtered)
    if (consoleMessages.length > 0) {
      console.log('\n=== All Console Messages ===');
      consoleMessages.forEach((msg, i) => {
        const preview = msg.text.length > 200 ? msg.text.substring(0, 200) + '...' : msg.text;
        console.log(`[${i + 1}] [${msg.type}] ${preview}`);
      });
    } else {
      console.log('No console messages captured');
    }
    
    // Show network errors
    if (networkErrors.length > 0) {
      console.log('\n=== Network Errors ===');
      networkErrors.forEach((err, i) => {
        console.log(`[${i + 1}] ${err.url}`);
        if (err.failure) {
          console.log(`   Error: ${err.failure.errorText}`);
        }
        if (err.status) {
          console.log(`   Status: ${err.status}`);
        }
      });
    } else {
      console.log('\nNo network errors detected');
    }
    
    // Show errors specifically
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log('\n=== Errors Found ===');
      errors.forEach((err, i) => {
        console.log(`[${i + 1}] ${err.text}`);
      });
    }
    
    // Check for error messages on page
    const errorElements = await page.locator('text=/שגיאה|error|Error/i').all();
    if (errorElements.length > 0) {
      console.log('\n=== Error Messages Found ===');
      for (const elem of errorElements) {
        const text = await elem.textContent();
        console.log(`Error: ${text}`);
      }
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);
    
    // Check if we navigated away from login page (success)
    if (currentUrl !== 'http://localhost:8081/login' && !currentUrl.includes('/login')) {
      console.log('\n✅ SUCCESS: Navigated away from login page!');
      console.log(`New URL: ${currentUrl}`);
    } else {
      console.log('\n⚠️ Still on login page - checking for errors...');
      
      // Check for error messages in the DOM
      const errorTexts = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => {
            const text = el.textContent || '';
            return text.includes('שגיאה') || text.includes('error') || text.includes('Error');
          })
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .slice(0, 5);
      });
      
      if (errorTexts.length > 0) {
        console.log('\n=== Error Messages on Page ===');
        errorTexts.forEach((text, i) => console.log(`${i + 1}. ${text}`));
      }
    }
    
  } catch (error) {
    console.error('Error occurred:', error);
    await page.screenshot({ path: 'error.png', fullPage: true });
  } finally {
    // Keep browser open for a bit to see results
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();

