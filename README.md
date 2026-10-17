# JosiahSBern.github.io

My portfolio site, live at https://josiahsbern.github.io. A robot arm built in Three.js is the navigation: it grabs each page by its tab and swaps in the next one.

## Structure

```
index.html        page layout and section markup
css/style.css     all styles
js/content.js     projects, experience, skills, and contact info
js/robot.js       the arm: inverse kinematics, joint servo model, grab sequences
js/main.js        rendering, navigation, lazy-loading Three.js
about.html ...    short URLs (/about, /projects, ...) that open the site at that section
images/           project photos and GIFs
resume.pdf
```

To update the site's text, edit `js/content.js`.
