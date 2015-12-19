$( document ).ready(function() {


  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
    $('#hiUser').html("Hi, " + result)
	  console.log("Hi "+result);                          
	});

  $("#rondellCarousel").rondell({
      preset: "carousel",
    });

});