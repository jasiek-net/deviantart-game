const DEFAULT_USER = '6artificial6';
const EMPTY_GALLERY = '<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>';
const SLIDE_LIMIT = 25;

// Initialization
var left_user = window.location.hash === '' ? '' : window.location.hash.split('!')[0].split('#')[1];
var right_user = window.location.hash === '' ? DEFAULT_USER : window.location.hash.split('!')[1];
var counter_good = 0;
var counter_bad = 0;

// API requests
const yahoo_req = (url, callback) => `http://query.yahooapis.com/v1/public/yql?q=${encodeURIComponent('select * from xml where url="' + url + '"')}&_maxage=86400&format=json&callback=${callback}`;
const deviant_req = (user) => user !== '' ? `http://backend.deviantart.com/rss.xml?type=deviation&q=by:${user}` : 'http://backend.deviantart.com/rss.xml?sort:time';
const DEVIANT_LOGO = 'http://img13.deviantart.net/2777/i/2016/260/e/5/logo__14___the_deviantart_logo_by_octss-dahwy98.png';

// Listeners
$('.actions .dislike').on('click', changeUser);
$('.actions .like').on('click', changeUser);
$(document).keydown(function(e) {
  switch(e.which) {
    // left
    case 37: return $("#tinderslide").jTinder('dislike');
    // right
    case 39: return $("#tinderslide").jTinder('like');
    // exit this handler for other keys
    default: return;
  }
  // prevent the default action (scroll / move caret)
  e.preventDefault();
});

function resetGame() {
  $('#gallery').html(EMPTY_GALLERY);
  counter_good = 0;
  counter_bad = 0;
}

function gameOver() {
  let score = Math.floor(counter_good / (counter_bad + counter_good) * 100)
  alert(`Game Over, your score: ${score}%!\nClick to play again!`);
  bar.animate(0);
  resetGame()
  runGame()
}

function changeUser(e) {
  e.preventDefault();
  var name = prompt("Enter nickname of deviant or leave empty to set random photos")
  if (name === null) { return null }
  resetGame();
  if (e.target.className === 'btn-like') { right_user = name }
  if (e.target.className === 'btn-dislike') { left_user = name }
  window.location.hash = left_user + '!' + right_user;
  runGame();
}

function photos(url) {
  return new Promise((res, rej) => {
    var s = document.createElement('script');
    s.src = yahoo_req(url, 'callback');
    document.body.appendChild(s);
    window['callback'] = callback;
    function callback(feed) {

      if (typeof feed.query.results.rss.channel.item === 'undefined') {
        alert(`User does not exist! Selected random photos.`);
        return rej('USER NOT EXISTS');
      }

      var deviations = [];
      var items = feed.query.results.rss.channel.item;

      for(var i = 0, l = items.length; i < l; i++) {
        if (items[i].content.url &&
          (items[i].content.url.slice(-3) === 'jpg' || items[i].content.url.slice(-3) === 'png')) {

          var object = {};
          object.title = items[i].title[0];
          // object.image = items[i].content.url;
          object.image = (items[i].thumbnail && typeof items[i].thumbnail === 'object' && items[i].thumbnail[1])
            ? items[i].thumbnail[1].url
            : items[i].content.url
          deviations.push(object);
        }
      }
      res(deviations)
    }

  })
}

function image(image, number) {
  return `
  <li class="${number}">
    <div class="img" style="background: url('${image}') no-repeat scroll center center; background-size: contain"></div>
    <div class="dislike"></div>
    <div class="like"></div>
  </li>`;
}

function runGame() {
  photos(deviant_req(right_user))
  .then(photo_right => {
    photos(deviant_req(left_user))
    .then(photo_left => {
      const right_profile = right_user !== '' ? photo_right.shift().image : DEVIANT_LOGO;
      const left_profile = left_user !== '' ? photo_left.shift().image : DEVIANT_LOGO;

      const pr = shuffle(photo_right);
      const pl = shuffle(photo_left);

      const len = pr.length + pl.length < SLIDE_LIMIT ? pr.length + pl.length : SLIDE_LIMIT;
      var result = image(DEVIANT_LOGO, 'last') + image(DEVIANT_LOGO, 'last');
      for (let i = 0; i < len; i++) {
        const numb = Math.floor(Math.random() * 2) + 1
        if (numb === 1) {
          if (pr.length > 0) {
            result += image(pr.pop().image, 1)
          } else {
            result += image(pl.pop().image, 2)
          }
        } else {
          if (pl.length > 0) {
            result += image(pl.pop().image, 2)
          } else {
            result += image(pr.pop().image, 1)
          }
        }
      }
      $('.wrap').html(`<div id="tinderslide"><ul id="gallery">${result}</ul></div>`);
      runTinder();
      setPhoto(left_profile, right_profile);
    })
    .catch(err => {
      left_user = '';
      runGame();
    })
  })
  .catch(err => {
    right_user = '';
    runGame();
  })
}

function runTinder() {
  $("#tinderslide").jTinder({
      onDislike: function (item) {
        if (item.attr('class') == 'last') { return gameOver() }

        if (item.attr('class') == 2) {
          counter_good += 1
        } else {
          counter_bad += 1
        }
        bar.set(counter_good / (counter_good + counter_bad))
      },
      onLike: function (item) {
        if (item.attr('class') == 'last') { return gameOver() }

        if (item.attr('class') == 1) {
          counter_good += 1
        } else {
          counter_bad += 1
        }
        bar.set(counter_good / (counter_good + counter_bad))
      },
    animationRevertSpeed: 200,
    animationSpeed: 400,
    threshold: 1,
    likeSelector: '.like',
    dislikeSelector: '.dislike'
  });
}

var bar = new ProgressBar.Line('#progress', {
  strokeWidth: 4,
  easing: 'easeInOut',
  duration: 1400,
  color: '#FFEA82',
  trailColor: '#eee',
  trailWidth: 1,
  svgStyle: {width: '100%', height: '100%'},
  text: {
    style: {
      // Text color.
      // Default: same as stroke color (options.color)
      color: '#999',
      position: 'absolute',
      right: '0',
      top: '30px',
      padding: 0,
      margin: 0,
      transform: null
    },
    autoStyleContainer: false
  },

  from: {color: '#ED6A5A'},
  to: {color: '#5cb85c'},
  step: (state, bar) => {
    bar.setText(Math.round(bar.value() * 100) + ' %');
    bar.path.setAttribute('stroke', state.color);
  }
});

bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
bar.text.style.fontSize = '18px';
bar.text.style.right = '20px';
bar.animate(0);  // Number from 0.0 to 1.0

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function setPhoto(left, right) {
  const obj = (img) => ({
    'background': `url("${img}") no-repeat scroll center center`,
    'background-size': 'cover'
  })
  $('#tinderslide .dislike').css(obj(left))
  $('.actions .btn-dislike').css(obj(left))
  $('#tinderslide .like').css(obj(right))
  $('.actions .btn-like').css(obj(right));
}

runGame()
