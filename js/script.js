var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;
var nytcategoryArray = ['hardcover-fiction','trade-fiction-paperback','e-book-fiction','mass-market-paperback',
  'hardcover-nonfiction','e-book-nonfiction'];
var loadCounter;
var shopApiUrl = "https://api.shop.com/sites/v1/search/term/Books/";

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

        console.log(data["results"]["books"]["0"]);

        $('#rondellcarousel').append(anchor);
        getProductDetails(data);

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

function getProductDetails(data){

  var bookName = data["results"]["books"]["0"]["title"].toLowerCase();
  var contributor = data["results"]["books"]["0"]["contributor"];
  var modBookTitle = bookName.split(' ').join("+");

  var paperBack = bookName + " (Paperback)";
  var hardCover = bookName + " (Hardcover)";
  var compactDics = bookName + " (Compact Disc)";
  var isbn = data["results"]["books"]["0"]["primary_isbn13"];
  var theDescription;
  var splitDescription;
  var splitAuthorName;
  var author;



  console.log("title: " + modBookTitle);

  $.ajax({
    type: "GET",
    typeData:"json",
    url: shopApiUrl+modBookTitle,
    success: function(data){



      for(var i = 0; i < data.searchItems.length; i++) {

        if(isbn === data.searchItems[i].prods_CatalogSKU){
          console.log("Found first try                         " + data.searchItems[i].caption);
        }else {

          theDescription = data.searchItems[i].the_Description;
          splitDescription = theDescription.split(" ", 3) + "";
          splitAuthorName = splitDescription.split(/[;,]+/);
          author = splitAuthorName[0] + " " + splitAuthorName[2] + " " + splitAuthorName[1];

          if(hardCover.toLowerCase() === data.searchItems[i].caption.toLowerCase().substring(0, (hardCover.length + 1))) {
            if( author === contributor){
              console.log("Found second try                         " + hardCover + data.searchItems[i].caption);
            }
          }

          if(paperBack.toLowerCase() === data.searchItems[i].caption.toLowerCase().substring(0, paperBack.length + 1)){
            if( author === contributor) {
              console.log("Found second try                         " + paperBack + data.searchItems[i].caption);
            }
          }
        }
      }

    }

  });

}


