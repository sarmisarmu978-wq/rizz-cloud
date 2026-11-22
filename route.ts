import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { r2,bucket } from "@/lib/r2";
export const runtime="nodejs";
const MAX_FILE=1024*1024*1024;
export async function POST(req:Request){
 try{
  const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {name,size,type}=await req.json();
  if(typeof name!=="string"||!name.trim()||!Number.isFinite(size)||size<=0)return NextResponse.json({error:"Data file tidak valid."},{status:400});
  if(size>MAX_FILE)return NextResponse.json({error:"Ukuran file maksimal 1 GB."},{status:413});
  const safeName=name.replace(/[^\w.\- ()]/g,"_").slice(0,150);
  const key=`${user.id}/${randomUUID()}-${safeName}`;
  const command=new PutObjectCommand({Bucket:bucket,Key:key,ContentType:typeof type==="string"?type:"application/octet-stream",ContentLength:size});
  const uploadUrl=await getSignedUrl(r2,command,{expiresIn:900});
  return NextResponse.json({uploadUrl,key});
 }catch(e){console.error(e);return NextResponse.json({error:"Gagal menyiapkan upload. Periksa konfigurasi R2."},{status:500})}
}