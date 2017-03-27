/**
 * 项目名称 - 版本号
 * 类名称
 * @author : lenovo
 * 基础类
 * @description : 请添加描述信息
 * @date : 2017/3/24
 */
"use strict";

let d3 = require('d3');
import {Common} from './Common.js';
class Chart{
    constructor(svg){
        if(new.target !== Chart){
            throw new Error("Chart 不是函数，请使用new来生成实例~~~");
        }

        if(typeof svg === 'string'){
            this.svg = d3.select("#"+svg);
        }else {
            this.svg = svg;
        }
        //this.context = this.canvas.getContext('2d');

        let options = this.options = {};
        //let d3Canvas = d3.select(this.canvas);
        options.padding = 50;
        options.width = +this.svg.attr('width') - options.padding;
        options.height = +this.svg.attr('height')/5*3;
        options.color = d3.interpolateCool;

    }

    themeRiver(data,options){
        //todo 构造options

        /**stack 生成器
         * 必须设置key访问器，stack 生成器按照key来生成数据，返回一个数组，数组每个元素代表对应的key值对应的数据序列，
         * 序列内部就是按照剩下的哪一个数组元素的key计算出的堆叠偏移量，
         *
         * 默认情况下使用第一个分量作为计算堆叠偏移量的key,使用剩下的n-1个作为分组计算
         */
        //this.context.translate(50,0);
        let _options = this.options;
        //todo 添加一些themeRiver特有的配置属性
        Object.assign(_options,{
            order: d3.stackOrderNone,//次序是根据keys得到的，相当于没有排序
            offset: d3.stackOffsetWiggle
        });
        Object.assign(_options,options);

        let auxiliaryG = this.svg.append('g');

        console.log(data[0]);
        let keys = Object.keys(data[0]);


        let sliceK = keys.slice(1);
        let stack = d3.stack()
            .keys(sliceK)
            .order(_options.order)
            .offset(_options.offset);

        let _data = stack(data);

        let x = d3.scaleLinear()
            .domain([0, time.length+1])
            .range([0, _options.width]);


        let y = d3.scaleLinear()
            .domain([d3.min(_data,Common.stackMin),d3.max(_data,Common.stackMax)])
            .range([_options.height, 0]);

        let z = d3.scaleLinear()
            .domain([0,sliceK.length])
            .range([0,1]);

        let area = d3.area()
            .x((d,i)=>x(i))
            .y0((d)=>y(d[0]))
            .y1((d)=>y(d[1]))
            .curve(d3.curveNatural);
            //.context(this.context);

        //arc生成器
        let arc2 = d3.arc()
            .innerRadius(0)
            .outerRadius(_options.height/4);
        let pie = d3.pie()
            .value(function (d) {
                return d['v'];
            });

        let streamG= this.svg.append("g")
            .attr('transform','translate(0,'+(+this.svg.attr('height')/3-25)+')');

        streamG.selectAll(".stream")
            .data(_data)
            .enter().append("path")
            .attr("class",'stream')
            .attr('transform','translate('+_options.padding+',0)')
            .attr("d", area)
            .attr("fill", function(d,i) { return _options.color(z(i)); });

        //设置缓冲区
        let buffer = [];
        for (let i=0; i< time.length; i++){
            let d = x(i);
            buffer.push([d-10, d+10]);
        }
        let popup = d3.select("#popup");

        let currentArc = null;
        this.svg.on('mousemove',()=>{
            let coords = d3.mouse(document.getElementById("svg"));

            let flag = true;
            for(let i = 0; i<buffer.length; i++){
                let b = buffer[i];
                let x = coords[0] - _options.padding;
                if(x > b[0] && x < b[1]){
                    flag = false;
                    //let k = sliceK[i];
                    let total = 0;

                    let auxiliaryData = [];
                    let d = data[i];

                    for(let i=0, sliceNames=names.slice(1); i< sliceNames.length; i++){
                        let de = sliceNames[i];
                        popup.select("#"+de).html(de+":" + d[de])
                            .style('color',_options.color(z(i)));
                        total += d[de];
                        auxiliaryData.push({
                            area:de,
                            v:d[de]
                        })
                    }
                    popup.select("#total").html('Total: ' + total);
                    popup.transition().duration(1000).style('opacity','0.8');

                    //绘制辅助图
                    let _auxD = pie(auxiliaryData);

                    let update = auxiliaryG.selectAll('.aux').data(_auxD);

                    currentArc = update.enter().append("path")
                        .merge(update)
                        .attr('class','aux')
                        .attr('d',arc2)
                        .attr('transform','translate('+_options.width/2+','+(_options.height/3-30)+')')
                        .style('fill',function(d,i) { return _options.color(z(i));})
                        .transition()
                        .duration(1000)
                        //.attr('d',arc2)
                        .style('opacity',1);
                    break;
                }
            }
            if(flag){
                if(currentArc !== null){
                    currentArc.transition()
                        .duration(1000)
                        /*.attr('d',arc1)*/
                        .style('opacity',0.2);
                }
                currentArc=null;
                popup.transition().duration(1000).style('opacity','0.2');
            }
        });
        this.svg.on('mouseout',()=>{
            if(currentArc !== null){
                currentArc.transition()
                    .duration(1000)
                    /*.attr('d',arc1)*/
                    .style('opacity',0.2);
            }
            currentArc=null;
            popup.transition().duration(1000).style('opacity','0.2');});


        let orderScale = d3.scaleOrdinal()
            .domain(time)
            .range((function () {
                let range=[];
                for(let i=0; i<=time.length; i++){
                    range.push(x(i));
                }
                return range;
            }()));
        //x轴

        //let svg = d3.select("#svg");
        streamG.append("g")
            .attr("transform", "translate("+_options.padding+"," + _options.height + ")")
            .call(d3.axisBottom(orderScale).ticks(time.length));
        //y轴
        let axisLeft = this.axis([d3.max(_data,Common.stackMax), d3.min(_data,Common.stackMin)],{
            scale:d3.scaleLinear,
            direction:'axisLeft'
        });
        streamG.append("g")
            .attr("transform", "translate("+_options.padding+",0)")
            .call(d3.axisLeft(y));

       /* streamG.append("g")
            .attr("transform", "translate("+_options.padding+",0)")
            .call(d3.axisBottom(orderScale).ticks(time.length));*/


    }

    /**
     * 顺序
     * @param domain
     * @param option
     */
    axis(domain, option){
        let _option =this.options;
        //初始化默认选项
        Object.assign(_option,{
            scale:d3.scaleOrdinal,
            direction:'axisBottom',
            order:'asc'
        });
        //用户配置选项
        Object.assign(_option, option);

        let scale = _option.scale()
            .domain(domain);

        if(_option.order === 'asc'){
            if(_option.direction === 'axisBottom' || _option.direction === 'axisTop'){
                scale.range([0,_option.width]);
            }else if(_option.direction === 'axisLeft' || _option.direction === 'axisRight') {
                scale.range([0,_option.height]);
            }
        }else {
            if(_option.direction === 'axisBottom' || _option.direction === 'axisTop'){
                scale.range([_option.width,0]);
            }else if(_option.direction === 'axisLeft' || _option.direction === 'axisRight') {
                scale.range([_option.height,0]);
            }
        }

        //d3.axisBottom(orderScale)
        return d3[_option.direction](scale);

    }
}
let chart = new Chart('svg');
let names = ["time","North_America","Bermuda","Canada","Greenland","Mexico",
    "Saint_Pierre_and_Miquelon","United_States","South_America","Bahamas",
    "Barbados","Belize","Bolivia","Brazil","Cayman_Islands","Chile","Colombia","Costa_Rica","Cuba","Dominica"];
let _data = [
    [1980,320.27638,0.05473,24.5933,0.05021,68.34748,0.00599,227.22468,293.05856,0.20976,0.25197,0.14442,5.4413,123.01963,0.01708,11.09372,26.63129,2.29912,9.65298,0.07389],
    [1981,324.44694,0.05491,24.9,0.05103,69.96926,0.00601,229.46571,299.43033,0.21345,0.25236,0.14921,5.54522,125.99213,0.0179,11.2823,27.21489,2.35729,9.71198,0.07352],
    [1982,367.70684,0.0581,28.1179,0.05554,86.48803,0.00633,252.98094,365.15137,0.24931,0.26334,0.19575,6.73148,153.58396,0.02751,13.35367,33.83221,3.09302,10.61114,0.07012],
    [1983,332.72487,0.05551,25.4563,0.05211,73.36288,0.00607,233.79199,312.51136,0.22086,0.25485,0.15685,5.73743,131.96012,0.01909,11.68662,28.45499,2.49435,9.88126,0.07429],
    [1984,336.72143,0.05585,25.7018,0.05263,75.08014,0.00611,235.8249,318.87955,0.22462,0.25611,0.16081,5.83429,134.69947,0.02002,11.87977,29.09546,2.5676,9.97373,0.07399],
    [1985,340.74811,0.05618,25.9416,0.05315,76.76723,0.00616,237.9238,325.22704,0.2282,0.25725,0.16556,5.93494,137.38198,0.02085,12.0678,29.74762,2.64431,10.06563,0.07311],
    [1986,344.89548,0.05651,26.2038,0.05364,78.44243,0.00621,240.13289,331.82291,0.23143,0.25827,0.17124,6.04135,140.19628,0.02144,12.261,30.41039,2.72338,10.14438,0.07238],
    [1987,328.62014,0.05517,25.2019,0.05166,71.6409,0.00605,231.66446,305.95253,0.21713,0.25348,0.1533,5.64222,129.02765,0.01852,11.48711,27.82604,2.42437,9.78922,0.07381],
    [1988,353.2939,0.05717,26.8948,0.05485,81.78182,0.00628,244.49898,345.44544,0.23771,0.25995,0.1814,6.28316,145.87275,0.0245,12.67869,31.77087,2.87412,10.30552,0.07134],
    [1989,357.68457,0.05749,27.3793,0.05541,83.36684,0.00631,246.81923,352.20471,0.24124,0.26109,0.18643,6.42314,148.65864,0.02507,12.90232,32.46085,2.94989,10.4079,0.07051],
    [1990,403.85585,0.06198,30.55166,0.05661,97.32506,0.00642,275.8541,409.62879,0.27599,0.27129,0.23513,7.8589,171.20116,0.03606,14.79216,38.13259,3.71374,10.99853,0.07004],
    [1991,367.70684,0.0581,28.1179,0.05554,86.48803,0.00633,252.98094,365.15137,0.24931,0.26334,0.19575,6.73148,153.58396,0.02751,13.35367,33.83221,3.09302,10.61114,0.07012],
    [1992,373.29069,0.0587,28.54489,0.05549,88.11103,0.00636,256.51422,371.43224,0.25356,0.2646,0.20082,6.89345,156.03206,0.02868,13.57416,34.52032,3.16836,10.69191,0.07028],
    [1993,378.74233,0.05924,28.95334,0.05564,89.74914,0.00638,259.91859,377.7438,0.25766,0.2657,0.20609,7.05434,158.51205,0.03001,13.78943,35.2056,3.25653,10.75667,0.07042],
    [1994,383.9166,0.05975,29.33081,0.05592,91.3379,0.0064,263.12582,384.26984,0.26151,0.26663,0.21155,7.21481,161.01706,0.0313,14.00122,35.88762,3.3512,10.81326,0.07092],
    [1995,388.97216,0.06029,29.69053,0.05619,92.88035,0.0064,266.27839,390.75665,0.26518,0.26767,0.21717,7.37487,163.54428,0.03249,14.20661,36.53183,3.44474,10.86545,0.07142],
    [1996,393.9428,0.06087,30.02632,0.05634,94.39858,0.00641,269.39428,397.13002,0.26888,0.26881,0.22297,7.5344,166.08586,0.03368,14.40541,37.09791,3.536,10.9117,0.071],
    [1997,398.97205,0.06145,30.3056,0.05651,95.89515,0.00642,272.64693,403.41352,0.27256,0.27006,0.22895,7.69515,168.63874,0.03487,14.60109,37.61994,3.62532,10.95186,0.07028],
    [1998,403.85585,0.06198,30.55166,0.05661,97.32506,0.00642,275.8541,409.62879,0.27599,0.27129,0.23513,7.8589,171.20116,0.03606,14.79216,38.13259,3.71374,10.99853,0.07004],
    [1999,408.60296,0.06251,30.82026,0.0567,98.61691,0.00643,279.04017,415.63607,0.27931,0.2725,0.24148,8.02556,173.76387,0.03725,14.97655,38.56386,3.80017,11.05298,0.07035],
    [2000,362.4468,0.05778,27.7906,0.05563,84.91365,0.00632,249.62281,358.79973,0.24513,0.26226,0.19087,6.5739,151.17006,0.02636,13.12892,33.14725,3.02327,10.51344,0.07001],
    [2001,417.83236,0.06361,31.37674,0.05713,101.24696,0.00637,285.08156,427.24012,0.28569,0.27491,0.25464,8.36745,178.86966,0.03962,15.33189,39.31245,3.95621,11.15582,0.07121],
    [2002,422.05268,0.06418,31.64096,0.05736,102.47993,0.00633,287.80391,433.05116,0.28858,0.27622,0.2613,8.54249,181.41759,0.0408,15.50394,39.80495,4.02095,11.20269,0.07153],
    [2003,426.06238,0.06476,31.88931,0.05754,103.71806,0.00629,290.32642,438.97976,0.29135,0.27755,0.26796,8.71906,183.95992,0.04199,15.67191,40.35102,4.08382,11.24668,0.07173],
    [2004,430.26938,0.06534,32.13476,0.0577,104.95959,0.00625,293.04574,445.01525,0.29406,0.27882,0.27462,8.89597,186.4886,0.04316,15.83563,40.92215,4.1467,11.28785,0.07193],
    [2005,434.47232,0.06591,32.38638,0.05778,106.2029,0.0062,295.75315,451.05504,0.29671,0.28004,0.28129,9.07294,188.99308,0.04434,15.99504,41.48778,4.20869,11.32615,0.07212],
    [2006,438.82964,0.06644,32.65668,0.05764,107.44953,0.00615,298.59321,457.01699,0.29929,0.28121,0.28795,9.24971,191.46901,0.04552,16.15084,42.04625,4.26977,11.36155,0.07225],
    [2007,443.3473,0.06692,32.93596,0.05753,108.70089,0.0061,301.5799,462.89157,0.30197,0.28236,0.29461,9.42594,193.91858,0.04669,16.30385,42.59732,4.33113,11.39404,0.07238],
    [2008,447.67394,0.06739,33.2127,0.05756,109.9554,0.00605,304.37485,468.73872,0.30473,0.2835,0.30127,9.60126,196.34259,0.04786,16.45414,43.14111,4.39324,11.42395,0.07251],
    [2009,451.83698,0.06784,33.48721,0.0576,111.21179,0.006,307.00655,474.53897,0.30755,0.28459,0.3079,9.77525,198.73927,0.04904,16.60171,43.67737,4.45505,11.45165,0.07266],
    [2010,456.59331,0.06827,33.75974,0.05764,112.46886,0.00594,310.23286,480.01228,0.31043,0.28565,0.31452,9.94742,201.10333,0.05021,16.74649,44.20529,4.51622,11.47746,0.07281]

];

let time = [1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010];
let data=[];
for(let i=0; i<_data.length; i++){
    let tmpD = _data[i];
    let d={};
    for(let j=0; j<names.length; j++){
        d[names[j]+""]=tmpD[j];
    }
    data.push(d);
}
console.log(data);
chart.themeRiver(data);