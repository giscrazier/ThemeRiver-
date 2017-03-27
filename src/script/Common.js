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
export class Common{
    static stackMin(data){
        return d3.min(data,(d)=>d[0])
    }
    static stackMax(data){
        return d3.max(data,(d)=> d[1]);
    }
}