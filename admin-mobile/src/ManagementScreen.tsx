import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

type Product={docId:string;id?:number;name:string;category:string;mainCategory?:string;subCategory?:string;price:number;stock:number;active:boolean;description?:string;imageUrl?:string;specifications?:string[]};
type Category={id:string;mainCategory:string;name:string;active:boolean};
type Booking={id:string;customerName?:string;phone?:string;email?:string;service?:string;address?:string;city?:string;preferredDate?:string;preferredTime?:string;details?:string;status?:string};
type Customer={name:string;phone:string;city:string;orders:number;spent:number};
const mains=['Electronics','Hardware','Home Services'];
const bookingStatuses=['Pending','Contacted','Confirmed','In Progress','Completed','Cancelled'];
const money=(n=0)=>'NPR '+n.toLocaleString('en-IN');
const blank={name:'',category:'Electronics',subCategory:'',price:'',stock:'0',description:'',imageUrl:'',specifications:'',active:true};
export default function ManagementScreen(){
 const [section,setSection]=useState('Products');
 const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<Category[]>([]),[bookings,setBookings]=useState<Booking[]>([]),[customers,setCustomers]=useState<Customer[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [form,setForm]=useState(blank),[editing,setEditing]=useState(''),[busy,setBusy]=useState(false),[categoryMain,setCategoryMain]=useState('Electronics'),[categoryName,setCategoryName]=useState(''),[editingCategory,setEditingCategory]=useState('');
 const [stockDraft,setStockDraft]=useState<Record<string,string>>({});
 useEffect(()=>{
  let ready=0;const done=()=>{ready++;if(ready>=4)setLoading(false)};
  const u1=onSnapshot(collection(db,'products'),s=>{setProducts(s.docs.map(d=>({docId:d.id,...d.data()} as Product)));done()},()=>{setError('Unable to read products. Check Firestore permissions.');done()});
  const u2=onSnapshot(collection(db,'categories'),s=>{setCategories(s.docs.map(d=>({id:d.id,...d.data()} as Category)));done()},()=>{setError('Unable to read categories.');done()});
  const u3=onSnapshot(collection(db,'serviceBookings'),s=>{setBookings(s.docs.map(d=>({id:d.id,...d.data()} as Booking)));done()},()=>{setError('Unable to read service bookings.');done()});
  const u4=onSnapshot(collection(db,'orders'),s=>{
   const map=new Map<string,Customer>();
   s.docs.forEach(d=>{const x=d.data();const key=String(x.phone||x.customerName||d.id);const prev=map.get(key)||{name:String(x.customerName||'Customer'),phone:String(x.phone||''),city:String(x.city||''),orders:0,spent:0};prev.orders++;prev.spent+=Number(x.total)||0;map.set(key,prev)});
   setCustomers([...map.values()].sort((a,b)=>b.orders-a.orders));done();
  },()=>{setError('Unable to read customer orders.');done()});
  return()=>{u1();u2();u3();u4()};
 },[]);
 const subcats=useMemo(()=>categories.filter(c=>c.mainCategory===form.category&&c.active),[categories,form.category]);
 function editProduct(p:Product){setEditing(p.docId);setForm({name:p.name||'',category:p.mainCategory||p.category||'Electronics',subCategory:p.subCategory||'',price:String(p.price??''),stock:String(p.stock??0),description:p.description||'',imageUrl:p.imageUrl||'',specifications:(p.specifications||[]).join('\n'),active:p.active!==false});}
 function resetProduct(){setEditing('');setForm(blank)}
 async function saveProduct(){
  if(!form.name.trim()||!form.price||Number(form.price)<=0){setError('Enter a product name and a valid price.');return}
  setBusy(true);setError('');
  const data={name:form.name.trim(),category:form.category,mainCategory:form.category,subCategory:form.subCategory,price:Number(form.price),stock:Math.max(0,Number(form.stock)||0),description:form.description.trim(),imageUrl:form.imageUrl.trim(),specifications:form.specifications.split('\n').map(x=>x.trim()).filter(Boolean),active:form.active,emoji:'',...(editing?{}:{id:Date.now()})};
  try{if(editing)await updateDoc(doc(db,'products',editing),data);else await addDoc(collection(db,'products'),data);resetProduct()}
  catch{setError('Could not save product. Check Firestore rules and try again.')}
  finally{setBusy(false)}
 }
 async function removeProduct(p:Product){Alert.alert('Delete product',`Delete ${p.name}?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{void deleteDoc(doc(db,'products',p.docId)).catch(()=>setError('Could not delete product.'))}}])}
 async function saveCategory(){if(!categoryName.trim())return;setBusy(true);setError('');try{if(editingCategory)await updateDoc(doc(db,'categories',editingCategory),{mainCategory:categoryMain,name:categoryName.trim()});else await addDoc(collection(db,'categories'),{mainCategory:categoryMain,name:categoryName.trim(),active:true});setCategoryName('');setEditingCategory('')}catch{setError('Could not save category.')}finally{setBusy(false)}}
 async function removeCategory(c:Category){Alert.alert('Delete subcategory',`Delete ${c.name}?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{void deleteDoc(doc(db,'categories',c.id)).catch(()=>setError('Could not delete category.'))}}])}
 async function setBookingStatus(b:Booking,status:string){try{await updateDoc(doc(db,'serviceBookings',b.id),{status})}catch{setError('Could not update booking status.')}}
 async function saveStock(p:Product){const value=Math.max(0,Number(stockDraft[p.docId]??p.stock)||0);try{await updateDoc(doc(db,'products',p.docId),{stock:value});setStockDraft(old=>({...old,[p.docId]:String(value)}))}catch{setError('Could not update stock.')}}
 const tabs=['Products','Categories','Bookings','Customers','Inventory'];
 return <ScrollView style={s.root} contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
  <Text style={s.heading}>Store management</Text><Text style={s.sub}>Manage your store from one place. Changes sync with the website.</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{tabs.map(t=><TouchableOpacity key={t} onPress={()=>setSection(t)} style={[s.tab,section===t&&s.tabOn]}><Text style={[s.tabText,section===t&&s.tabTextOn]}>{t}</Text></TouchableOpacity>)}</ScrollView>
  {!!error&&<Text style={s.error}>{error}</Text>}
  {loading?<ActivityIndicator size="large" color="#F28C28" style={{marginTop:35}}/>:<>
  {section==='Products'&&<>
   <View style={s.card}><Text style={s.cardTitle}>{editing?'Edit product':'Add product'}</Text>
    <TextInput style={s.input} placeholder="Product name" placeholderTextColor="#98A2B3" value={form.name} onChangeText={v=>setForm({...form,name:v})}/>
    <Text style={s.field}>MAIN CATEGORY</Text><View style={s.chips}>{mains.map(v=><TouchableOpacity key={v} onPress={()=>setForm({...form,category:v,subCategory:''})} style={[s.smallChip,form.category===v&&s.smallChipOn]}><Text style={[s.smallText,form.category===v&&s.smallTextOn]}>{v}</Text></TouchableOpacity>)}</View>
    <TextInput style={s.input} placeholder="Subcategory (optional)" placeholderTextColor="#98A2B3" value={form.subCategory} onChangeText={v=>setForm({...form,subCategory:v})}/>
    {subcats.length>0&&<View style={s.chips}>{subcats.map(c=><TouchableOpacity key={c.id} onPress={()=>setForm({...form,subCategory:c.name})} style={[s.smallChip,form.subCategory===c.name&&s.smallChipOn]}><Text style={[s.smallText,form.subCategory===c.name&&s.smallTextOn]}>{c.name}</Text></TouchableOpacity>)}</View>}
    <View style={s.two}><TextInput style={[s.input,s.half]} placeholder="Price (NPR)" keyboardType="numeric" value={form.price} onChangeText={v=>setForm({...form,price:v})}/><TextInput style={[s.input,s.half]} placeholder="Stock" keyboardType="numeric" value={form.stock} onChangeText={v=>setForm({...form,stock:v})}/></View>
    <TextInput style={s.input} placeholder="Product photo URL (Cloudinary image link)" placeholderTextColor="#98A2B3" autoCapitalize="none" value={form.imageUrl} onChangeText={v=>setForm({...form,imageUrl:v})}/>
    <TextInput style={[s.input,s.multiline]} placeholder="Description" placeholderTextColor="#98A2B3" multiline value={form.description} onChangeText={v=>setForm({...form,description:v})}/>
    <TextInput style={[s.input,s.multiline]} placeholder="Specifications (one per line)" placeholderTextColor="#98A2B3" multiline value={form.specifications} onChangeText={v=>setForm({...form,specifications:v})}/>
    <View style={s.switchRow}><Text style={s.field}>VISIBLE IN STORE</Text><Switch value={form.active} onValueChange={v=>setForm({...form,active:v})}/></View>
    <TouchableOpacity style={s.primary} disabled={busy} onPress={()=>void saveProduct()}><Text style={s.primaryText}>{busy?'Saving...':editing?'Save changes':'Add product'}</Text></TouchableOpacity>
    {editing!==''&&<TouchableOpacity style={s.secondary} onPress={resetProduct}><Text style={s.secondaryText}>Cancel edit</Text></TouchableOpacity>}
   </View>
   <Text style={s.sectionTitle}>Products ({products.length})</Text>
   {products.map(p=><View key={p.docId} style={s.card}><Text style={s.itemTitle}>{p.name}</Text><Text style={s.meta}>{p.mainCategory||p.category} {p.subCategory?' / '+p.subCategory:''} · {money(p.price)} · Stock {p.stock}</Text><Text style={s.meta}>{p.active?'Visible in store':'Hidden from store'}</Text><View style={s.actions}><TouchableOpacity style={s.outline} onPress={()=>editProduct(p)}><Text style={s.outlineText}>Edit</Text></TouchableOpacity><TouchableOpacity style={s.delete} onPress={()=>removeProduct(p)}><Text style={s.deleteText}>Delete</Text></TouchableOpacity></View></View>)}
  </>}
  {section==='Categories'&&<>
   <View style={s.card}><Text style={s.cardTitle}>{editingCategory?'Edit subcategory':'Add subcategory'}</Text><View style={s.chips}>{mains.map(v=><TouchableOpacity key={v} onPress={()=>setCategoryMain(v)} style={[s.smallChip,categoryMain===v&&s.smallChipOn]}><Text style={[s.smallText,categoryMain===v&&s.smallTextOn]}>{v}</Text></TouchableOpacity>)}</View><TextInput style={s.input} placeholder="Subcategory name" placeholderTextColor="#98A2B3" value={categoryName} onChangeText={setCategoryName}/><TouchableOpacity style={s.primary} disabled={busy} onPress={()=>void saveCategory()}><Text style={s.primaryText}>{editingCategory?'Save category':'Add category'}</Text></TouchableOpacity>{!!editingCategory&&<TouchableOpacity style={s.secondary} onPress={()=>{setEditingCategory('');setCategoryName('')}}><Text style={s.secondaryText}>Cancel</Text></TouchableOpacity>}</View>
   {mains.map(main=><View key={main} style={s.card}><Text style={s.cardTitle}>{main}</Text>{categories.filter(c=>c.mainCategory===main).map(c=><View key={c.id} style={s.listRow}><Text style={s.itemTitle}>{c.name}</Text><View style={s.actions}><TouchableOpacity onPress={()=>{setEditingCategory(c.id);setCategoryMain(c.mainCategory);setCategoryName(c.name)}}><Text style={s.link}>Edit</Text></TouchableOpacity><TouchableOpacity onPress={()=>removeCategory(c)}><Text style={s.deleteText}>Delete</Text></TouchableOpacity></View></View>)}</View>)}
  </>}
  {section==='Bookings'&&<><Text style={s.sectionTitle}>Service bookings ({bookings.length})</Text>{bookings.length===0?<Text style={s.empty}>No service bookings yet.</Text>:bookings.map(b=><View key={b.id} style={s.card}><Text style={s.itemTitle}>{b.service||'Service request'}</Text><Text style={s.meta}>{b.customerName||'Customer'} · {b.phone||'No phone'}</Text><Text style={s.meta}>{b.address||''}, {b.city||''}</Text><Text style={s.meta}>{b.preferredDate||'Date not set'} · {b.preferredTime||'Flexible'}</Text><Text style={s.detail}>{b.details||''}</Text><View style={s.chips}>{bookingStatuses.map(st=><TouchableOpacity key={st} onPress={()=>void setBookingStatus(b,st)} style={[s.smallChip,(b.status||'Pending')===st&&s.smallChipOn]}><Text style={[s.smallText,(b.status||'Pending')===st&&s.smallTextOn]}>{st}</Text></TouchableOpacity>)}</View></View>)}</>}
  {section==='Customers'&&<><Text style={s.sectionTitle}>Customers ({customers.length})</Text>{customers.length===0?<Text style={s.empty}>Customers appear here after placing orders.</Text>:customers.map((c,i)=><View key={c.phone||i} style={s.card}><Text style={s.itemTitle}>{c.name}</Text><Text style={s.meta}>{c.phone} · {c.city}</Text><Text style={s.meta}>{c.orders} orders · {money(c.spent)} total order value</Text></View>)}</>}
  {section==='Inventory'&&<><Text style={s.sectionTitle}>Inventory ({products.length} products)</Text><Text style={s.sub}>Update stock quantities. Low stock means 5 or fewer units.</Text>{products.slice().sort((a,b)=>a.stock-b.stock).map(p=><View key={p.docId} style={s.card}><Text style={s.itemTitle}>{p.name}</Text><Text style={s.meta}>Current stock: {p.stock} {p.stock<=5?'· LOW STOCK':''}</Text><View style={s.actions}><TextInput style={[s.input,s.stockInput]} keyboardType="numeric" value={stockDraft[p.docId]??String(p.stock)} onChangeText={v=>setStockDraft(old=>({...old,[p.docId]:v}))}/><TouchableOpacity style={s.primarySmall} onPress={()=>void saveStock(p)}><Text style={s.primaryText}>Save stock</Text></TouchableOpacity></View></View>)}</>}
  </>}
 </ScrollView>
}
const s=StyleSheet.create({
 root:{flex:1},page:{padding:18,paddingBottom:40},heading:{fontSize:26,fontWeight:'900',color:'#14213D'},sub:{fontSize:12,color:'#667085',lineHeight:18,marginTop:5,marginBottom:14},
 tabs:{gap:8,paddingBottom:15},tab:{paddingVertical:10,paddingHorizontal:14,borderRadius:20,borderWidth:1,borderColor:'#D9E0E8',backgroundColor:'#FFF'},tabOn:{backgroundColor:'#102A43',borderColor:'#102A43'},tabText:{fontSize:11,fontWeight:'800',color:'#667085'},tabTextOn:{color:'#FFF'},
 error:{color:'#B42318',backgroundColor:'#FFF1F0',padding:11,borderRadius:10,fontSize:12,marginBottom:12},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E5EAF0',borderRadius:15,padding:15,marginBottom:12},cardTitle:{fontSize:16,fontWeight:'900',color:'#102A43',marginBottom:12},sectionTitle:{fontSize:18,fontWeight:'900',color:'#102A43',marginTop:12,marginBottom:12},input:{borderWidth:1,borderColor:'#D9E0E8',borderRadius:10,paddingHorizontal:12,paddingVertical:11,color:'#14213D',fontSize:13,marginBottom:10,backgroundColor:'#FFF'},multiline:{minHeight:72,textAlignVertical:'top'},two:{flexDirection:'row',gap:9},half:{flex:1},field:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#667085',marginBottom:8},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:10},smallChip:{borderWidth:1,borderColor:'#D9E0E8',borderRadius:18,paddingHorizontal:10,paddingVertical:7},smallChipOn:{backgroundColor:'#102A43',borderColor:'#102A43'},smallText:{fontSize:10,color:'#667085',fontWeight:'700'},smallTextOn:{color:'#FFF'},primary:{backgroundColor:'#F28C28',padding:13,borderRadius:10,alignItems:'center',marginTop:4},primarySmall:{backgroundColor:'#F28C28',paddingHorizontal:12,paddingVertical:11,borderRadius:9,justifyContent:'center'},primaryText:{color:'#FFF',fontSize:12,fontWeight:'900'},secondary:{padding:11,alignItems:'center'},secondaryText:{color:'#667085',fontWeight:'700',fontSize:12},switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:6},itemTitle:{fontSize:14,fontWeight:'800',color:'#344054'},meta:{fontSize:11,color:'#667085',marginTop:5},detail:{fontSize:12,color:'#475467',marginTop:8,lineHeight:18},actions:{flexDirection:'row',alignItems:'center',gap:10,marginTop:12},outline:{borderWidth:1,borderColor:'#D9E0E8',borderRadius:8,paddingHorizontal:13,paddingVertical:8},outlineText:{fontSize:11,color:'#102A43',fontWeight:'800'},delete:{padding:8},deleteText:{fontSize:11,color:'#B42318',fontWeight:'800'},listRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:10,borderTopWidth:1,borderTopColor:'#EEF1F5'},link:{fontSize:11,color:'#1D4ED8',fontWeight:'800'},empty:{padding:18,color:'#667085',backgroundColor:'#FFF',borderRadius:12},stockInput:{width:105,marginBottom:0},});
