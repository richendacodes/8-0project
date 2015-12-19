$( document ).ready(theMainFunction);


function theMainFunction(){

  $("#rondellCarousel").rondell({
    preset: "carousel",
  });

  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
    $('#hiUser').html("Hi, " + result)
    console.log("Hi "+result);                          
  });

}