var NYTBESTSELLERURL = "http://api.nytimes.com/svc/books/v3/lists/best-sellers";
var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;

$( document ).ready(function() {
	myFirebaseRef = new Firebase(FIREBASEURL);
  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {                
	  console.log("Hi "+result);                          
	});
	getBestSellers();

});

function getBestSellers(){

	$.ajax({
		url: NYTBESTSELLERURL,
		dataType:"json",
		type:"GET",
		success:function(data){
			 console.log(data);
		}

	});

}

