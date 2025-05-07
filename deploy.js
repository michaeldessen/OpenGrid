const ghpages = require('gh-pages');
const path = require('path');

ghpages.publish(path.join(__dirname, 'build'), {
  branch: 'gh-pages',
  repo: 'https://github.com/michaeldessen/OpenGrid.git', // Replace with your repo URL
  message: 'Auto-generated commit',
  dotfiles: true,
  add: true
}, function(err) {
  if (err) {
    console.error('Deployment error:', err);
  } else {
    console.log('Deployment successful!');
  }
});