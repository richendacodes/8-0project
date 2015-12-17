$( document ).ready(function() {


  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {                
	  console.log("Hi "+result);                          
	});

});