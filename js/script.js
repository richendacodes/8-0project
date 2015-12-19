var NYTURL = "http://api.nytimes.com/svc/books/v3/lists";
var EBOOKFICTIONNYTLIST = NYTURL+"/e-book-fiction.json"
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
  var nyTimesRef = myFirebaseRef.child("APIKEYS/nytimes").on("value", function(snapshot) {

    var nytBestSellerUrl = EBOOKFICTIONNYTLIST+"?" + "api-key="+snapshot.val();
    $.ajax({
      url: nytBestSellerUrl,
      dataType: "json",
      type: "GET",
      success: function (data) {
        console.log(data);
      }

    });

  });

}

