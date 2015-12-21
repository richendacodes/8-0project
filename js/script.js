var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;
var nytcategoryArray = ['hardcover-fiction','trade-fiction-paperback','e-book-fiction','mass-market-paperback',
  'hardcover-nonfiction','e-book-nonfiction'];
var loadCounter;


$( document ).ready(theMainFunction);


function theMainFunction() {
  myFirebaseRef = new Firebase(FIREBASEURL);
  loadCounter = nytcategoryArray.length;

  bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function (result) {
    console.log("Hi " + result);
  });


  $.ajax({
    url:"js/categorybooklist.json",
    dataType:"json",
    type:"GET",
    success: function(data){
      for(var i = 0; i < nytcategoryArray.length; i++){
        getBestSellersAndFillCarousel(data[nytcategoryArray[i]]);

      }


    }
  });

}

function getBestSellersAndFillCarousel(nytUrl){

  var nyTimesRef = myFirebaseRef.child("APIKEYS/nytimes").on("value", function(snapshot) {
    nytUrl+="?"+"api-key="+snapshot.val();
    $.ajax({
      url: nytUrl,
      dataType: "json",
      type: "GET",
      success: function (data) {
        var anchor = $('<a>');
        anchor.attr("rel","rondell");
        anchor.attr("href","#");
        var img = $('<img>');
        img.attr("src",data["results"]["books"]["0"]["book_image"]);
        img.addClass("resizeable");
        anchor.append(img);

        $('#rondellcarousel').append(anchor);

        if((--loadCounter) == 0){
          $('#rondellcarousel').rondell({
            preset: "carousel"
          });
        }

      },

      error: function(){
        console.log("puff");
      }

    });

  });

}



