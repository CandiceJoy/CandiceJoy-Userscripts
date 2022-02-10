# CandiceJoy's Userscripts

## Instructions
>If you have suggestions, please submit them as issues and I'll do what I can ^_^

Download your userscript manager of choice, then click the links for the userscripts you want to install :)  
Chrome: [TamperMonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)  
Firefox: [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

### AmiAmi Refresher

---
[Download](https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js)  
- No config yet (edit the code to configure)
- Auto add to cart (with price threshold)
- Click JAN code to see MFC page
- Change currencies
- Refreshes the page every X seconds (configurable)
- Yes, it will refresh the page until the figure is available then add it to your cart :)  (best used in conjunction with buyfriend.moe notifications)

### AmiAmi Search Filter  

---  
[Download](https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-SearchFilter.user.js)  
- Built-in configuration page ("Config Filter" in upper right)
- Highlight low prices (configurable)
- Change the currency
- Custom price threshold
- Redone page navigation
- Condition tags for all figures
- MFC link for all figures
- Keyword blacklist
- Keyword whitelist (bypasses condition and price filters)
- Filter by price
- Filter by condition
- Filter by availability
- Filter by AmiAmi weirdness (missing prices, figures that show in stock but aren't, etc etc etc)
- Combine with AmiAmi Refresher to automatically add figure to cart in one click

### Buyfriend Redirect

---
[Download](https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/BuyfriendRedirect.user.js)
- Buyfriend.moe notification auto-click

### MFC Mark All Read

----
[Download](https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js)
- Mark All Read button for MFC notifications

### Development

----
1. Install gulp and all reqs from package.json
2. There are three tasks - Build Dev PC, Build Dev Mac, and Build Prod
   1. Build Dev PC - Sets BUILD_TYPE to "PC"; output goes to dev/
   2. Build Dev Mac - Sets BUILD_TYPE to "Mac"; output goes to dev/
   3. Build Prod - Sets BUILD_TYPE to "Prod"; output goes to "."
3. Edit the source files to use the correct path if building for dev (the version in the repo is what I use) OR copy the
   end-user version into your userscript manager OR build dev, copy the dev header, and change the path in your
   userscript manager
4. Run the task to build the file you want.
5. Do not submit pull requests with changes to the paths in the source headers unless there's a bug in them in the end-user version