var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;
var nytcategoryArray = ['hardcover-fiction','trade-fiction-paperback','e-book-fiction','mass-market-paperback',
  'hardcover-nonfiction','e-book-nonfiction','paperback-nonfiction','advice-how-to-and-miscellaneous'];
var nytBestSellingDict = {};
var loadCounter;
var isbnsCounter;
var successfulDisplay;

var shopApiUrl = "https://api.shop.com/sites/v1/search/term/Books/";
var fullShopApiUrl;
var fullGoogleApiUrl;
var nytTitle;
var nytAuthor;
var nytAmazonURL;
var nytImage;
var nytTitleLowerCase;
var bookTitleOnSplit;
var bookTitle;
var reviewUrl;

var theProductData;
var theGoogleData;
var breakNotifier;
var anotherBreak;
var bookSearchItem;
var shopBookPrice;
var shopURL;
var author;

var googleBookDescription;
var googleBookImage;

var myProductHash = {};
var myGoogleHash = {};

$( document ).ready(theMainFunction);


function theMainFunction() {
  myFirebaseRef = new Firebase(FIREBASEURL);
  loadCounter = nytcategoryArray.length;

  var userName = bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
  var name = result.length;

 if (name != 0) {
      $('#hiUser').html("Hi, " + result);
      return;
    } else 
       var userAgain = bootbox.prompt("Let's try that again, please enter your name?", function(result) {
       var name = result.length;

       if (name != 0) {
            $('#hiUser').html("Hi, " + result);
            return;
          } else 
            $('#hiUser').html("Hi, party pooper");

      }  )    
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
    var key = snapshot.val();
    key = key.replace(/:/g,"%3A");
    nytUrl+="?"+"api-key="+key;

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
        anchor.val({"books":data["results"]["books"],
                    "listing":data["results"]["list_name"]});
        anchor.on("click",function(){callGetProductDetails(this,true)});
        anchor.on("click",fillBestSellersListing);

        img.addClass("resizeable");

        anchor.append(img);
        $('#rondellcarousel').append(anchor);
        if((--loadCounter) == 0){
          $('#rondellcarousel').rondell({
            preset: "carousel"
          },function(){},function(){$('#rondellcarousel').find('.rondell-item-focused').trigger("click")});

        }
      }
    });
  });
}


function callGetProductDetails(anchor,isMany){
  if(isMany)
    getProductDetails($(anchor).val()["books"]["0"]);
  else
    getProductDetails($(anchor).val());
}


function fillBestSellersListing(){
  var books = $(this).val()["books"];
  var listing = $(this).val()["listing"];
  $('#bestsellerList').find('.panel-heading').find('h4').html(listing);
  $('#bestsellerList').find('.panel-body').empty();

  for(var i = 1; i < books.length; i++){
    var div = $('<div>');
    div.addClass("bestsellerItem");
    var span = $('<span>');
    span.append(books[""+i]["title"]);
    span.addClass("bestsellerTitle");
    div.append(span);
    div.append("<br>");
    span = $('<span>');
    span.addClass("bestsellerAuthor");
    span.append(books[""+i]["author"]);
    div.append(span);
    div.val(books[""+i]);
    div.on("click",function(){callGetProductDetails(this,false)});
    $('#bestsellerList').find('.panel-body').append(div);

  }
}


function getProductDetails(data){

  theProductData = data;
  breakNotifier = false;
  anotherBreak = false;
  nytTitle = theProductData.title;
  nytAuthor = theProductData.contributor;
  author = theProductData.author;

  nytAmazonURL = theProductData.amazon_product_url;
  nytImage = theProductData.book_image;
  reviewUrl = theProductData.book_review_link;
  successfulDisplay=0;

  nytTitleLowerCase = nytTitle.toLowerCase();
  bookTitleOnSplit = nytTitleLowerCase.split(' ');
  bookTitle = bookTitleOnSplit.join("+");

  fullShopApiUrl = shopApiUrl+bookTitle;


  if(myProductHash[fullShopApiUrl] === undefined){
    $.ajax({
      url: fullShopApiUrl,
      dataType: "json",
      type: "GET",
      success: findProductInShop

    });
  }else{
    findProductInShopHandler(myProductHash[fullShopApiUrl]);
  }

}


function findProductInShop(data){

  myProductHash[fullShopApiUrl] = data;
  findProductInShopHandler(myProductHash[fullShopApiUrl]);
}


function findProductInShopHandler(data){
  fullGoogleApiUrl = "https://www.googleapis.com/books/v1/volumes?q="+nytTitle+"+intitle:"+nytTitle+"+inauthor:"+author+"&key=AIzaSyBs2Kqqt1HgWffErU0e9XIQhj-CjYEswGM";

  for(var i = 0; i < theProductData.isbns.length; i++) {
    for(var j = 0; j < data.searchItems.length; j++){

      if((theProductData.isbns[i].isbn13 === data.searchItems[j].prods_CatalogSKU) || (theProductData.isbns[i].isbn13 === data.searchItems[j].manufacturerPartNumber)){
        breakNotifier = true;
        bookSearchItem = data.searchItems[j];
        shopBookPrice = data.searchItems[j].priceInfo.price;
        shopURL = data.searchItems[j].modelQuickViewDetails.linkUrl;
        break;
      }
    }

    if(breakNotifier == true){
      break;
    }
  }

  if(myGoogleHash[fullGoogleApiUrl] === undefined) {
    fullGoogleApiUrl = fullGoogleApiUrl.replace(/ /g,"%20");

    $.ajax({
      url: fullGoogleApiUrl,
      dataType: "json",
      type: "GET",
      success: findBookInfoInGoogleBooks

    });
  }else{
    findBookInfoInGoogleBooksHandler(myGoogleHash[fullGoogleApiUrl]);
  }
}


function findBookInfoInGoogleBooksHandler(data){

  theGoogleData = data;

  if(theGoogleData.items === undefined){
    displayContent();
    return;
  }

  if(theGoogleData.items.length > 0){

    googleBookDescription = theGoogleData.items[0].volumeInfo.description;
    if(theGoogleData.items[0].volumeInfo.imageLinks !== undefined){
      googleBookImage = theGoogleData.items[0].volumeInfo.imageLinks.thumbnail;
    }
    else{
      googleBookImage = nytImage;
    }

    anotherBreak = true;

    displayContent();

  }else{
    displayContent();
  }
}


function findBookInfoInGoogleBooks(data){
  myGoogleHash[fullGoogleApiUrl] = data;
  findBookInfoInGoogleBooksHandler(myGoogleHash[fullGoogleApiUrl]);

}


function displayContent(){

  if(breakNotifier === false && anotherBreak === false){

    var img = $('<img>').attr("src", nytImage).addClass("resize").addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text("No description available at this time...");

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").hide();
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").hide();
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();

    }else{
      $('#reviewRow').hide();
    }

  }else if(breakNotifier === true){

    var img;

    if(anotherBreak){

      if(nytImage === googleBookImage){
        img = $('<img>').attr("src", googleBookImage).addClass("resize").addClass("centerimage");
      }else{
        img = $('<img>').attr("src", googleBookImage).addClass("centerimage");
      }
    }else{

      img = $('<img>').attr("src", nytImage).addClass("resize").addClass("centerimage");
    }


    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);

    if(anotherBreak){
      if(googleBookDescription !== undefined){
        $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text(googleBookDescription);
      }
      else{
       //should put nyt description.
      }

    }
    else{
      $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text(theProductData.description);
    }


    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").show().text(shopBookPrice);
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").show().attr("href", shopURL).attr("target", "_blank");
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();
    }
    else{
      $('#reviewRow').hide();
    }
  }else{

    var img = $('<img>').attr("src", googleBookImage).addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text(googleBookDescription);

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").hide();
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").hide();
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();
    }
    else{
      $('#reviewRow').hide();
    }
  }

  breakNotifier = false;
  anotherBreak = false;
}