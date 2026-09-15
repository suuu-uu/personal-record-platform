"use client";
import { useEffect, useMemo, useRef } from "react";

function WheelColumn({items,selected,suffix,onSelect}:{items:number[];selected:number;suffix:string;onSelect:(value:number)=>void}){
  const selectedRef=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{selectedRef.current?.scrollIntoView({block:"center"})},[selected]);
  return <div className="wheel-column">{items.map(item=><button ref={item===selected?selectedRef:null} type="button" key={item} className={`wheel-item ${item===selected?"selected":""}`} onClick={()=>onSelect(item)}>{item}{suffix}</button>)}</div>;
}

export function DateWheel({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const current=new Date(`${value}T00:00:00`);const year=current.getFullYear();const month=current.getMonth()+1;const day=current.getDate();
  const years=useMemo(()=>Array.from({length:new Date().getFullYear()+11-1950},(_,index)=>1950+index),[]);
  const months=useMemo(()=>Array.from({length:12},(_,index)=>index+1),[]);
  const days=Array.from({length:new Date(year,month,0).getDate()},(_,index)=>index+1);
  function set(nextYear:number,nextMonth:number,nextDay:number){const safeDay=Math.min(nextDay,new Date(nextYear,nextMonth,0).getDate());onChange(`${nextYear}-${String(nextMonth).padStart(2,"0")}-${String(safeDay).padStart(2,"0")}`)}
  return <div className="date-wheel" aria-label="日期滚轴"><WheelColumn items={years} selected={year} suffix="年" onSelect={next=>set(next,month,day)}/><WheelColumn items={months} selected={month} suffix="月" onSelect={next=>set(year,next,day)}/><WheelColumn items={days} selected={day} suffix="日" onSelect={next=>set(year,month,next)}/></div>;
}
