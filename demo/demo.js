$(function() {

  $('#ex1').instaFilta();

  $('#ex2').instaFilta();

  $('#ex3').instaFilta({
    targets: '.planet-name',
    caseSensitive: true
  });

  $('#ex4').instaFilta({ markMatches: true });

  $('#ex5').instaFilta({ beginsWith: true });

  $('#ex6').instaFilta();

  var $resultMessage = $('#some-result-message');

  $('#ex7').instaFilta({
    onFilterComplete: function(matchedItems) {

      var message = matchedItems.length
        ? "I found " + matchedItems.length + " matches!"
        : "I couldn't find a thing..";

      $resultMessage.text(message);
    }
  });

  $('#ex8').instaFilta();

});
