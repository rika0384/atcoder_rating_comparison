var user =[];

var rate = [];
var count;
var histories = [];
var tableJQ = $('#rate');
var tweetplace = $('#tweetbutton');
var MaxRate = 3000;
var now;
var query_time;

$(function() {
    let m = new Map();
    let xs = location.search.substring(1).split('&');
    for (let x of xs) {
      let p = x.split('=');
      m.set(p[0], decodeURIComponent(p[1]));
    }
    if (m.has('q')) document.getElementById("handle").value = m.get('q');
    getData();

    $('#handle').on('keypress', function(ev) {
        if (ev.keyCode == 13) getData();
    })


});

function getData(){
    now = new Date();
    query_time = Math.floor(now/300);
    count = 0;
    user.length = 0;
    rate.length = 0;
    histories.length = 0;
    while( $('table tr').length > 1) {
      $('table tr:last').remove();
    }
    var str = document.getElementById("handle").value;
    history.replaceState('', '', `?q=${str}`);
    var tmp = str.split(" ");
    for(var i = 0; i < tmp.length; i++){
        if(tmp[i] != "") user.push(tmp[i]);
    }
    for(var i = 0; i < user.length; i++){
      getAtcoderRating(user[i]);
    }
}

function getAtcoderRating(handle){



    var check_url = "https://kenkoooo.com/atcoder/atcoder-api/results?user=" + handle;// + "&timestamp=" + query_time;

    fetch(check_url).then(function(response) {
            return response.json();
        }).then(function(data) {
            //console.log(data);
            if(data.length == 0){
                alert("'" + handle + "' is not found");
               return;
            }
        });

    var url = "https://atcoder.jp/users/" + handle +"/history/json";//"&timestamp=" + query_time;
    var xurl = encodeURIComponent(url);

    $.ajax({
         url: "./ajax.php?url="+xurl,
         dataType: 'json',
         type: "GET",
         timeout  : 20000,
         cache    : false,
         success: function(res) {
             var xmlText = res,
                 xmlDoc = $.parseXML(xmlText);
             console.log(res);
             history_atcoder = res;
             if(history_atcoder.length >= 1){
                 var highest = 0;
                 for(i = 0; i < history_atcoder.length; i++){
                     highest = Math.max(highest, Number(history_atcoder[i]['NewRating']));
                 }
                 if(highest > MaxRate) MaxRate = highest + 400;
                 rate.push([handle,Number(history_atcoder[history_atcoder.length-1]['NewRating']),highest]);
                 histories.push([handle,history_atcoder]);
             }
             count++;
             if(count === user.length){
               console.log(histories);
               console.log(rate);
                 histories.sort(function(a,b){ //userをレートでソート
                     return Number(b[1][b[1].length - 1]['NewRating']) - Number(a[1][a[1].length - 1]['NewRating']);
                   });
                 rate.sort(function(a,b){ //userをレートでソート
                       return b[1] - a[1];
                   });
                 makeTable();
                 makeGraph();
                 MaxRate = 3000;
             }
         }
     })

}

function makeTable(){

    var tweet = "";
    tweet += "AtCoder Rate Ranking\n";

    var colors = ['gray','brown','green','lightskyblue','blue','gold','orange','red'];

    for (var r = 0; r < rate.length; r++) {

        if(r < 5){
            var trJQ_r = $('<tr></tr>').addClass('top').appendTo(tableJQ);
        }else{
            var trJQ_r = $('<tr></tr>').appendTo(tableJQ);
        }
        $('<td></td>').text(r+1).appendTo(trJQ_r); //順位
        var url = 'https://beta.atcoder.jp/user/';
        url += rate[r][0];
        var rateColor = Math.min(Math.floor(rate[r][1]/400),7);
        $('<td></td>').append(
            $('<font></font>').text(rate[r][1] + ' (' + rate[r][2] + ')').attr('color',colors[rateColor]) //現在のレート(最高レート)
          ).appendTo(trJQ_r);

        $('<td></td>').append(
                $('<a></a>').append(
                    $('<font></font>').text(rate[r][0]).attr('color',colors[rateColor]) //ユーザー名
                  ).attr('href',url)
            ).appendTo(trJQ_r);

        tweet += r+1 + ". " + rate[r][0] + " (" + rate[r][1] + ")\n";



    }

    $.fn.appendTweetButton = function(url, text){
        $('#twitter-wjs').remove();
        $('iframe[title="Twitter Tweet Button"]').remove();
        $(this).append($("<a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-url=\""+url+"\" data-text=\""+text+"\" data-count=\"vertical\">Tweet<\/a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');<\/script>"));
    }
    //Tweetボタンの設置
    $("body").appendTweetButton($(location).attr('href'), tweet);
}



function makeSeries(){
      /*
        {user_id, [x:日時, y:レート, contestName, user_id]}
      */

      var ret = [];

      for(var i = 0; i < histories.length; i++){
        //  console.log(history[i]);
          var user_id = histories[i][0];
          //console.log(user_id);
          var data = [];
          for(var j = 0; j < histories[i][1].length; j++){
              //console.log(histories[i][1][j]);
              if(histories[i][1][j]['IsRated'] != true)continue;
              var x = new Date(histories[i][1][j]['EndTime']);
              var y = Number(histories[i][1][j]['NewRating']);
              var contestName = histories[i][1][j]['ContestName'];
              var perform = histories[i][1][j]['Performance'];
              data.push({x, y, contestName, user_id, perform});
          }
          //console.log(data);
          ret.push({name:user_id,data});
      }
      //console.log(ret);
      return ret;

}


function makeGraph(){

    console.log(MaxRate);

    new Highcharts.Chart({
            title: { text: null },
            tooltip: {
              formatter: function () {
                return `<b>${this.point.user_id}</b><br />` +
                  `Contest: ${this.point.contestName}<br />` +
                  `Date: ${Highcharts.dateFormat('%e %b %Y', this.x)}<br />` +
                  `Performance: ${this.point.perform}<br />` +
                  `Rate: ${this.y}`;
              }
            },
            xAxis: {
              type: 'datetime',
              title: { text: null },
              dateTimeLabelFormats: {month: '%b \'%y', year: '%Y'},
              tickInterval: 30758400000/4
            },
            yAxis: {
              min: 0,
              startOnTick: false,
              title: { text: null },
              plotLines: [{ value: 0, width: 1, color: '#808080' }],
              tickInterval: 400,
              max: MaxRate,
              plotBands: [
                { "from": 0, "to": 400 -1, "color": '#F9F9F9' },
                { "from": 400, "to": 800 - 1, "color": '#F9E6D3' },
                { "from": 800, "to": 1200 - 1, "color": '#D3F9D3' },
                { "from": 1200, "to": 1600 - 1, "color": '#D3FCFC' },
                { "from": 1600, "to": 2000 -1, "color": '#D3D3FF' },
                { "from": 2000, "to": 2400 - 1, "color": '#FCFCC3' },
                { "from": 2400, "to": 2800 - 1, "color": '#FFE9C3' },
                { "from": 2800, "to": 1000000, "color": '#FFC3C3' },
              ]
            },
            chart: { height: 600, type: 'line', zoomType: 'x', renderTo: 'graph-container' },
            plotOptions: { series: { marker: { enabled: false } } },
            credits: { enabled: false },
            series: makeSeries()
      });

}
