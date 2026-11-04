import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
type Item = { name?: string; quantity?: number; price?: number };
type Order = { id: string; orderId?: string; customerName?: string; phone?: string; address?: string; city?: string; notes?: string; paymentMethod?: string; total?: number; status?: string; items?: Item[]; createdAt?: { toDate?: () => Date } };
const statuses = ['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'];
const money = (n=0) => 'NPR ' + n.toLocaleString('en-IN');
export default function OrdersScreen() {
 const [orders,setOrders]=useState<Order[]>([]), [loading,setLoading]=useState(true), [error,setError]=useState('');
 const [search,setSearch]=useState(''), [filter,setFilter]=useState('All'), [expanded,setExpanded]=useState<string|null>(null), [saving,setSaving]=useState('');
 useEffect(()=>onSnapshot(collection(db,'orders'), snap=>{
  const list=snap.docs.map(d=>({id:d.id,...d.data()} as Order));
  list.sort((a,b)=>(b.createdAt?.toDate?.().getTime()??0)-(a.createdAt?.toDate?.().getTime()??0));
  setOrders(list); setLoading(false); setError('');
 },()=>{setError('Could not load orders. Check internet and Firestore rules.');setLoading(false)}),[]);
 const visible=useMemo(()=>orders.filter(o=>{
  const term=search.trim().toLowerCase();
  return (filter==='All'||(o.status||'Pending')===filter) && (!term||[o.orderId,o.id,o.customerName,o.phone,o.city].some(v=>String(v??'').toLowerCase().includes(term)));
 }),[orders,search,filter]);
 async function change(o:Order,status:string){
  if(status===(o.status||'Pending'))return;
  setSaving(o.id);setError('');
  try{await updateDoc(doc(db,'orders',o.id),{status,statusUpdatedAt:serverTimestamp()})}
  catch{setError('Could not update status. Check connection and try again.')}
  finally{setSaving('')}
 }
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
  <Text style={s.title}>Customer orders</Text><Text style={s.sub}>Search purchases and manage delivery progress</Text>
  {!!error&&<Text style={s.error}>{error}</Text>}
  <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search name, phone or order ID" placeholderTextColor="#98A2B3" autoCapitalize="none"/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['All',...statuses].map(v=><TouchableOpacity key={v} onPress={()=>setFilter(v)} style={[s.chip,filter===v&&s.chipOn]}><Text style={[s.chipText,filter===v&&s.chipTextOn]}>{v}</Text></TouchableOpacity>)}</ScrollView>
  <Text style={s.count}>{visible.length} orders found</Text>
  {loading?<ActivityIndicator color="#F28C28" size="large" style={{marginTop:30}}/>:visible.length===0?<View style={s.empty}><Text style={s.titleSmall}>No orders found</Text><Text style={s.sub}>{orders.length?'Try another search or filter.':'Website orders will appear here.'}</Text></View>:visible.map(o=>{
   const open=expanded===o.id, status=o.status||'Pending';
   return <View key={o.id} style={s.card}>
    <TouchableOpacity onPress={()=>setExpanded(open?null:o.id)}>
     <View style={s.row}><View style={{flex:1}}><Text style={s.orderId}>{o.orderId||o.id}</Text><Text style={s.date}>{o.createdAt?.toDate?o.createdAt.toDate().toLocaleString():'Date unavailable'}</Text></View><Text style={[s.badge,status==='Delivered'?s.green:status==='Cancelled'?s.red:s.amber]}>{status}</Text></View>
     <View style={s.row2}><View style={{flex:1}}><Text style={s.customer}>{o.customerName||'Customer'}</Text><Text style={s.meta}>{o.phone||'No phone'} · {o.city||'No city'}</Text></View><Text style={s.total}>{money(Number(o.total)||0)}</Text></View>
     <Text style={s.link}>{open?'HIDE DETAILS −':'VIEW DETAILS +'}</Text>
    </TouchableOpacity>
    {open&&<View style={s.details}>
     <Text style={s.label}>CUSTOMER DETAILS</Text><Text style={s.detail}>{o.customerName||'—'} · {o.phone||'—'}</Text><Text style={s.detail}>{o.address||'—'}, {o.city||'—'}</Text><Text style={s.detail}>Payment: {o.paymentMethod||'Cash on Delivery'}</Text>{!!o.notes&&<Text style={s.detail}>Note: {o.notes}</Text>}
     <Text style={[s.label,{marginTop:15}]}>PURCHASED ITEMS</Text>
     {(o.items||[]).map((it,i)=><View key={i} style={s.item}><Text style={s.detail}>{it.name||'Product'} × {Number(it.quantity)||1}</Text><Text style={s.detail}>{money((Number(it.price)||0)*(Number(it.quantity)||1))}</Text></View>)}
     <View style={s.row2}><Text style={s.label}>ORDER TOTAL</Text><Text style={s.total}>{money(Number(o.total)||0)}</Text></View>
     <Text style={[s.label,{marginTop:15}]}>UPDATE ORDER STATUS</Text><View style={s.statuses}>{statuses.map(v=><TouchableOpacity key={v} disabled={!!saving} onPress={()=>void change(o,v)} style={[s.statusBtn,status===v&&s.statusBtnOn]}><Text style={[s.statusTxt,status===v&&s.statusTxtOn]}>{v}</Text></TouchableOpacity>)}</View>
     {saving===o.id&&<Text style={s.meta}>Saving status...</Text>}
    </View>}
   </View>
  })}
 </ScrollView>
}
const s=StyleSheet.create({
 page:{padding:20,paddingBottom:30},title:{fontSize:27,fontWeight:'900',color:'#14213D'},titleSmall:{fontSize:16,fontWeight:'900',color:'#102A43'},sub:{fontSize:13,color:'#667085',marginTop:6,marginBottom:17},
 error:{color:'#B42318',backgroundColor:'#FFF1F0',padding:12,borderRadius:10,marginBottom:12,fontSize:12},search:{height:48,borderWidth:1,borderColor:'#D9E0E8',borderRadius:12,backgroundColor:'#FFF',paddingHorizontal:14,color:'#14213D'},
 filters:{gap:8,paddingVertical:14},chip:{borderWidth:1,borderColor:'#D9E0E8',borderRadius:20,paddingHorizontal:13,paddingVertical:8,backgroundColor:'#FFF'},chipOn:{backgroundColor:'#102A43',borderColor:'#102A43'},chipText:{fontSize:11,color:'#667085',fontWeight:'700'},chipTextOn:{color:'#FFF'},
 count:{fontSize:11,color:'#667085',fontWeight:'700',marginBottom:10},empty:{backgroundColor:'#FFF',borderRadius:16,padding:24,alignItems:'center'},card:{backgroundColor:'#FFF',borderRadius:16,padding:16,marginBottom:12,borderWidth:1,borderColor:'#E5EAF0'},
 row:{flexDirection:'row',alignItems:'flex-start',gap:8},orderId:{fontSize:14,fontWeight:'900',color:'#102A43'},date:{fontSize:10,color:'#98A2B3',marginTop:4},badge:{overflow:'hidden',borderRadius:20,paddingHorizontal:10,paddingVertical:6,fontSize:10,fontWeight:'800'},green:{color:'#126344',backgroundColor:'#EAF7F0'},red:{color:'#B42318',backgroundColor:'#FFF1F0'},amber:{color:'#9A5B08',backgroundColor:'#FFF4E5'},
 row2:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:14},customer:{fontSize:13,fontWeight:'800',color:'#344054'},meta:{fontSize:10,color:'#667085',marginTop:4},total:{fontSize:14,fontWeight:'900',color:'#102A43'},link:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#D97706',marginTop:14},
 details:{borderTopWidth:1,borderTopColor:'#EEF1F5',marginTop:14,paddingTop:14},label:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#98A2B3',marginBottom:8},detail:{fontSize:12,color:'#475467',lineHeight:19},item:{flexDirection:'row',justifyContent:'space-between',gap:8,paddingVertical:7,borderBottomWidth:1,borderBottomColor:'#F2F4F7'},statuses:{flexDirection:'row',flexWrap:'wrap',gap:7},statusBtn:{borderWidth:1,borderColor:'#D9E0E8',borderRadius:9,paddingHorizontal:10,paddingVertical:9},statusBtnOn:{backgroundColor:'#102A43',borderColor:'#102A43'},statusTxt:{fontSize:10,fontWeight:'700',color:'#667085'},statusTxtOn:{color:'#FFF'}
});