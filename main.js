var user =[];

var rate = [];
var count;
var histories = [];
var tableJQ = $('#rate');
var tweetplace = $('#tweetbutton');
var MaxRate = 3000;

$(function() {
    let m = new Map();
    let xs = location.search.substring(1).split('&');
    for (let x of xs) {
      let p = x.split('=');
      m.set(p[0], decodeURIComponent(p[1]));
    }
    if (m.has('q')) document.getElementById("handle").value = m.get('q');
    getData();
});

function getData(){
    count = 0;
    user.length = 0;
    rate.length = 0;
    histories.length = 0;
    while( $('table tr').length > 1) {
      $('table tr:last').remove();
    }
    var str = document.getElementById("handle").value;
    history.replaceState('', '', `?q=${str}`);
    user = str.split(" ");
    for(var i = 0; i < user.length; i++){
      getAtcoderRating(user[i]);
    }
}

function getAtcoderRating(handle){
    var url = "https://beta.atcoder.jp/users/" + handle +"/history/json";
    var query = "select * from json where url = '" + url + "'";
    var yql   = "https://query.yahooapis.com/v1/public/yql?format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&q=" + encodeURIComponent(query);
    $.ajax(
        {
              type     : 'GET',
              url      : yql,
              dataType : 'json',
              timeout  : 10000,
              cache    : false,
        }).done(function(data){

              console.log(data);
              if(handle != "" && data.query.results == null){
                  alert("'" + handle + "' is not found");
              }
              history_atcoder = data.query.results.json.json;
              var highest = 0;
              for(i = 0; i < history_atcoder.length; i++){
                  highest = Math.max(highest, Number(history_atcoder[i]['NewRating']));
              }
              if(highest > MaxRate) MaxRate = highest + 400;
              rate.push([handle,Number(history_atcoder[history_atcoder.length-1]['NewRating']),highest]);
              histories.push([handle,history_atcoder]);
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
        }).fail(function(data){
              alert("Failed(AC)");
        });
}

function makeTable(){

      var tweet = "";
      tweet += "AtCoder Rate Ranking\n"

        var colors = ['gray','brown','green','lightskyblue','blue','gold','orange','red'];

            for (var r = 0; r < user.length; r++) {

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


        var $widget = $("#twitter-widget-0");
        var src = $widget.attr("src");
        var url = src.replace(/\&text=.*\&/, "&text=" + encodeURIComponent(tweet) + "&");

        $widget.attr({src: url});
        tweetplace.html("").append($widget);
}



function makeSeries(){
      /*
        {user_id, [x:日時, y:レート, contestName, user_id]}
      */

      var ret = [];

      for(var i = 0; i < user.length; i++){
        //  console.log(history[i]);
          var user_id = histories[i][0];
        //  console.log(user_id);
          var data = [];
          for(var j = 0; j < histories[i][1].length; j++){
              console.log(histories[i][1][j]);
              if(histories[i][1][j]['IsRated'] != "true")continue;
              var x = new Date(histories[i][1][j]['EndTime']);
              var y = Number(histories[i][1][j]['NewRating']);
              var contestName = histories[i][1][j]['ContestName'];
              data.push({x, y, contestName, user_id});
          }
          ret.push({name:user_id,data});
      }

      return ret;

}


function makeGraph(){

    //console.log(MaxRate);

    new Highcharts.Chart({
            title: { text: null },
            tooltip: {
              formatter: function () {
                return `<b>${this.point.user_id}</b><br />` +
                  `Contest: ${this.point.contestName}<br />` +
                  `Date: ${Highcharts.dateFormat('%e %b %Y', this.x)}<br />` +
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
