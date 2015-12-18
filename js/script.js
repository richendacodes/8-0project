$( document ).ready(function() {


  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
    var result = result;
    if ($result.length <= 0)
        console.log('Sorry');
      else

    $('#hiUser').html("Hi, " + result)
	  console.log("Hi "+result);                          
	});


});