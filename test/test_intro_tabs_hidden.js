// test/test_intro_tabs_hidden.js
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function runComprehensiveBrowserVerification() {
  const testProbeScript = `
  <script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const suiteResults = [];

      function runSuite() {
        const dash = document.getElementById('actionsDashboard');
        const ev = document.getElementById('eventOverlayBox');
        const evTitle = document.getElementById('eventTitle');
        const mBtnVet = document.getElementById('mobileTabBtn_vet');
        const mBtnZoo = document.getElementById('mobileTabBtn_zooshans');
        const mBtnCare = document.getElementById('mobileTabBtn_care');

        // Test 1: Fresh run state before any choice
        suiteResults.push({
          name: 'initial_state_hidden',
          dashDisplay: window.getComputedStyle(dash).display,
          dashHidden: dash.classList.contains('hidden'),
          evDisplay: window.getComputedStyle(ev).display,
          day1ChoiceMade: window.state.onboarding.day1ChoiceMade,
          isMobileDisabled: mBtnVet.classList.contains('pointer-events-none')
        });

        // Test 2: Click Google search option
        const choices = Array.from(document.getElementById('eventChoicesContainer').querySelectorAll('button'));
        const googleChoice = choices.find(b => b.textContent.includes('Погуглить'));
        if (googleChoice) {
          googleChoice.click();
        }

        suiteResults.push({
          name: 'after_google_choice',
          day1ChoiceMade: window.state.onboarding.day1ChoiceMade,
          evTitle: document.getElementById('eventTitle').textContent.trim()
        });

        // Close the memo modal
        const memoChoice = document.querySelector('#eventChoicesContainer button');
        if (memoChoice) {
          memoChoice.click();
        }

        suiteResults.push({
          name: 'after_memo_closed',
          dashDisplay: window.getComputedStyle(dash).display,
          dashHidden: dash.classList.contains('hidden'),
          evHidden: ev.classList.contains('hidden'),
          isMobileActive: !mBtnVet.classList.contains('pointer-events-none')
        });

        // Test 3: Reset run via startNewRun()
        startNewRun();
        suiteResults.push({
          name: 'after_startNewRun_reset',
          dashDisplay: window.getComputedStyle(dash).display,
          dashHidden: dash.classList.contains('hidden'),
          evDisplay: window.getComputedStyle(ev).display,
          day1ChoiceMade: window.state.onboarding.day1ChoiceMade
        });

        const out = document.createElement('div');
        out.id = 'suiteOutput';
        out.textContent = JSON.stringify(suiteResults);
        document.body.appendChild(out);
      }

      runSuite();
    }, 1000);
  });
  </script>
  `;

  let html = fs.readFileSync(path.join(__dirname, '..', 'game_modular', 'index.html'), 'utf8');
  html = html.replace('</body>', testProbeScript + '</body>');
  const tempPath = path.join(__dirname, '..', 'game_modular', 'temp_suite_test.html');
  fs.writeFileSync(tempPath, html, 'utf8');

  try {
    const out = cp.execFileSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
      '--headless',
      '--window-size=1280,1024',
      '--virtual-time-budget=5000',
      '--dump-dom',
      'file:///' + tempPath.replace(/\\/g, '/')
    ], { encoding: 'utf8' });

    const match = out.match(/<div id="suiteOutput">(.*?)<\/div>/);
    if (!match) {
      console.error('FAIL: Suite output not found');
      process.exit(1);
    }
    const res = JSON.parse(match[1]);
    console.log('Comprehensive test results:', JSON.stringify(res, null, 2));

    let failed = false;

    // Check Test 1
    const t1 = res.find(r => r.name === 'initial_state_hidden');
    if (!t1 || t1.dashDisplay !== 'none' || !t1.dashHidden || t1.day1ChoiceMade !== false || !t1.isMobileDisabled) {
      console.error('FAIL: Test 1 (initial_state_hidden) failed', t1);
      failed = true;
    } else {
      console.log('PASS: Test 1 - Actions dashboard and mobile tabs hidden and disabled initially.');
    }

    // Check Test 2
    const t2 = res.find(r => r.name === 'after_google_choice');
    if (!t2 || t2.day1ChoiceMade !== true) {
      console.error('FAIL: Test 2 (after_google_choice) failed', t2);
      failed = true;
    } else {
      console.log('PASS: Test 2 - Google choice set day1ChoiceMade to true.');
    }

    // Check Test 3
    const t3 = res.find(r => r.name === 'after_memo_closed');
    if (!t3 || t3.dashDisplay !== 'flex' || t3.dashHidden || !t3.evHidden || !t3.isMobileActive) {
      console.error('FAIL: Test 3 (after_memo_closed) failed', t3);
      failed = true;
    } else {
      console.log('PASS: Test 3 - Actions dashboard revealed after memo closed.');
    }

    // Check Test 4
    const t4 = res.find(r => r.name === 'after_startNewRun_reset');
    if (!t4 || t4.dashDisplay !== 'none' || !t4.dashHidden || t4.day1ChoiceMade !== false) {
      console.error('FAIL: Test 4 (after_startNewRun_reset) failed', t4);
      failed = true;
    } else {
      console.log('PASS: Test 4 - startNewRun properly resets to hidden intro state.');
    }

    if (failed) {
      process.exit(1);
    }
    console.log('\n>>> ALL COMPREHENSIVE SUITE TESTS PASSED! <<<');
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

runComprehensiveBrowserVerification();
