window['left'] = window.location.hash === '' ? '' : window.location.hash.split('!')[0].split('#')[1];
window['right'] = window.location.hash === '' ? '6artificial6' : window.location.hash.split('!')[1];

resetGame()

function resetGame() {
  $('#gallery').html('<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>')
  window['counter_good'] = 0;
  window['counter_bad'] = 0;
}

function changeUser(e) {
  e.preventDefault();
  var name = prompt("Enter nickname of deviant or leave empty to set random photos")
  if (name === null) { return null }
  resetGame();
  if (e.target.className === 'btn-like') { window['right'] = name }
  if (e.target.className === 'btn-dislike') { window['left'] = name }
  window.location.hash = window['left'] + '!' + window['right'];
  runGame();
}

$('.actions .dislike').on('click', changeUser);
$('.actions .like').on('click', changeUser);

function photos(url) {
  return new Promise((res, rej) => {
    var s = document.createElement('script');
    s.src = "http://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent('select * from xml where url="' + url + '"') + "&_maxage=86400&format=json&callback=callback";
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

var userUrl = (user) =>
  user !== ''
  ? `http://backend.deviantart.com/rss.xml?type=deviation&q=by:${user}`
  : 'http://backend.deviantart.com/rss.xml?sort:time'

function runGame() {
  var right = userUrl(window['right'])
  var left = userUrl(window['left'])

  photos(right)
  .then(photo1 => {
    photos(left)
    .then(photo2 => {
      const logo = 'http://img13.deviantart.net/2777/i/2016/260/e/5/logo__14___the_deviantart_logo_by_octss-dahwy98.png'
      var rightP = window['right'] !== '' ? photo1.shift().image : logo;
      var leftP = window['left'] !== '' ? photo2.shift().image : logo;

      const u1 = shuffle(photo1);
      const u2 = shuffle(photo2);
      const krzysztof = rightP;
      const image = (img, numb) => (`<li class="${numb}">` +
        `<div class="img" style="background: url('${img}') no-repeat scroll center center; background-size: contain"></div>` +
        `<div class="dislike"></div>` +
        `<div class="like"></div>` +
        `</li>`)

      var len = u1.length + u2.length < 50 ? u1.length + u2.length : 50;
      var result = image(krzysztof, 'last');
      for (let i = 0; i < len; i++) {
        const numb = Math.floor(Math.random() * 2) + 1
        if (numb === 1) {
          if (u1.length > 0) {
            result += image(u1.pop().image, 1)
          } else {
            result += image(u2.pop().image, 2)
          }
        } else {
          if (u2.length > 0) {
            result += image(u2.pop().image, 2)
          } else {
            result += image(u1.pop().image, 1)
          }
        }
      }
      $('.wrap').html(
        '<div id="tinderslide">' +
        '<ul id="gallery">' +
        result +
        '</ul>' +
        '</div>'
        )
      runTinder();
      setPhoto(leftP, rightP);
    })
    .catch(err => {
      window['left'] = '';
      runGame();
    })
  })
  .catch(err => {
    window['right'] = '';
    runGame();
  })
}


function gameOver() {
  let score = Math.floor(counter_good / (counter_bad + counter_good) * 100)
  alert(`Game Over, your score: ${score}%!\nClick to play again!`);
  bar.animate(0);
  resetGame()
  runGame()
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

window['bar'] = new ProgressBar.Line('#progress', {
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

$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
          $("#tinderslide").jTinder('dislike');
          break;
        // case 38: // up
        // break;
        case 39: // right
          $("#tinderslide").jTinder('like');
          break;
        // case 40: // down
        // break;
        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

runGame()
