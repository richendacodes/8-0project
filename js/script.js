var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;
var nytcategoryArray = ['hardcover-fiction','trade-fiction-paperback','e-book-fiction','mass-market-paperback',
  'hardcover-nonfiction','e-book-nonfiction','paperback-nonfiction','advice-how-to-and-miscellaneous'];
var nytBestSellingDict = {};
var loadCounter;

var ebayFindItemApiUrl = "http://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByProduct&SERVICE-VERSION=1.0.0&SECURITY-APPNAME="
var ebayFindProductApiUrl = "http://open.api.ebay.com/shopping?callname=FindProducts&appid=";
var ebayShopLink;
var ebayPrice;
var ebayInfoExist;
var snapShot;

var fullGoogleApiUrl;
var nytTitle;
var nytAuthor;
var nytAmazonURL;
var nytImage;
var reviewUrl;

var theProductData;
var theGoogleData;
var googleInfoExist;
var author;

var googleBookDescription;
var googleBookImage;
var myGoogleHash = {};

$( document ).ready(theMainFunction);

function theMainFunction() {
  myFirebaseRef = new Firebase(FIREBASEURL);
  loadCounter = nytcategoryArray.length;

  var userName = bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result){
    var name = result.length;
    if (name != 0) {
      $('#hiUser').html("Hi, " + result);
      return;
    }else {
      var userAgain = bootbox.prompt("Let's try that again, please enter your name?", function (result) {
        var name = result.length;

        if (name != 0) {
          $('#hiUser').html("Hi, " + result);
          return;
        } else
          $('#hiUser').html("Hi, party pooper");
      })
    }
  });


  var nyTimesRef = myFirebaseRef.child("APIKEYS/nytimes").on("value", function(snapshot) {

    $.ajax({
      url:"js/categorybooklist.json",
      dataType:"json",
      type:"GET",
      success: function(data){
        for(var i = 0; i < nytcategoryArray.length; i++){
          getBestSellersAndFillCarousel(data[nytcategoryArray[i]],snapshot.val());

        }
      }
    });

  });

}


function getBestSellersAndFillCarousel(nytUrl,key){

  key = key.replace(/:/g,"%3A");
  nytUrl+="?"+"api-key="+key;

  $.ajax({
    url: nytUrl,
    dataType: "json",
    type: "GET",
    success: function (data) {

      var list = $('<li>');
      var img = $('<img>');
      var anchor = $('<a>');
      anchor.attr("rel","rondell");
      anchor.attr("href","#");
      img.attr("src",data["results"]["books"]["0"]["book_image"]);
      img.addClass("resizeFlip");
      anchor.val({"books":data["results"]["books"], "listing":data["results"]["list_name"]});
      anchor.on("click",function(){callGetProductDetails(this,true)});
      anchor.on("click",fillBestSellersListing);

      $('#theflip').append(list.append(anchor.append(img)));

      if((--loadCounter) == 0) {
        $('.my-flipster').flipster({
          start: 'center',
          scrollwheel: false
        });

        $('#theflip').find('.flipster__item--current').find('a').trigger("click");
      }
    }
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
    div.on("click",function(){
      callGetProductDetails(this,false)
    });

    $('#bestsellerList').find('.panel-body').append(div);
  }
}



function getProductDetails(data){

  theProductData = data;
  ebayInfoExist = false;
  googleInfoExist = false;
  nytTitle = theProductData.title;
  nytAuthor = theProductData.contributor;
  author = theProductData.author;

  nytAmazonURL = theProductData.amazon_product_url;
  nytImage = theProductData.book_image;
  reviewUrl = theProductData.book_review_link;


  var ebayRef = myFirebaseRef.child("APIKEYS/ebay").on("value", function(snapshot) {
    snapShot = snapshot.val();

    $.ajax
    ({
      type: "GET",
      url: ebayFindProductApiUrl + snapShot + '&version=517&siteid=0',
      dataType: "jsonp",
      jsonp: "callbackname",
      crossDomain : true,
      data: {
        'QueryKeywords' : nytTitle + " Book " + author,
        'MaxEntries' : '3',
        'responseencoding': 'JSON'
      },
      success: ebayProductIdRetrieval,
      error: function (data) {
        console.log(arguments);
      }
    });

  });
}



function ebayProductIdRetrieval(result){

  if(result.Ack === "Success") {
    var productId = result.Product[0].ProductID[0].Value;

    $.ajax({
      type: "GET",
      url: ebayFindItemApiUrl + snapShot + '&RESPONSE-DATA-FORMAT=JSON&paginationInput.entriesPerPage=2&productId.@type=ReferenceID&productId=' + productId,
      dataType: "jsonp",
      crossDomain: true,
      success: ebayInfoRetrieval,
      error: function (data) {
        console.log(arguments);
      }
    });
  }else{
    console.log("Error");
    findProductInGoogleHandler(result);
  }
}



function ebayInfoRetrieval(result){


  if(result.findItemsByProductResponse[0].searchResult[0].item !== undefined){
    ebayShopLink = result.findItemsByProductResponse[0].itemSearchURL[0];
    ebayPrice = result.findItemsByProductResponse[0].searchResult[0].item[0].sellingStatus[0].currentPrice[0].__value__;
    ebayInfoExist = true;

    findProductInGoogleHandler(result);
  }else{
    console.log("No Ebay Info Available");
    findProductInGoogleHandler(result);
  }

}



function findProductInGoogleHandler(data){
  fullGoogleApiUrl = "https://www.googleapis.com/books/v1/volumes?q="+nytTitle+"+intitle:"+nytTitle+"+inauthor:"+author+"&key=AIzaSyBs2Kqqt1HgWffErU0e9XIQhj-CjYEswGM";

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
    } else{
      googleBookImage = nytImage;
    }

    googleInfoExist = true;
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

  if(ebayInfoExist === false && googleInfoExist === false){

    var img = $('<img>').attr("src", nytImage).addClass("resize").addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text("No description available at this time...");

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").hide();
    $("#bookInfoPanel").find(".row").find(".bookEbayLink").children("a").hide();
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

  }else if(ebayInfoExist === true){

    var img;

    if(googleInfoExist){

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

    if(googleInfoExist){
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


    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").show().text("Price: $" + (parseFloat(ebayPrice)).toFixed(2));
    $("#bookInfoPanel").find(".row").find(".bookEbayLink").children("a").show().attr("href", ebayShopLink).attr("target", "_blank");
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
    $("#bookInfoPanel").find(".row").find(".bookEbayLink").children("a").hide();
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

  ebayInfoExist = false;
  googleInfoExist = false;
}