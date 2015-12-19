$( document ).ready(function() {

  var userName = bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
  var name = result.length

 if (name != 0) {
      $('#hiUser').html("Hi, " + result);
    } else 
      $('#hiUser').html("Hi, party pooper");
      
	});

  $("#rondellCarousel").rondell({
      preset: "carousel",
    });

});