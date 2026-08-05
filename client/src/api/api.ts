import axios from 'axios';
import {useState} from "react";
import {AuthInfo} from "../auth";

export const clientApi = axios.create({
  baseURL: '/api',
  withCredentials: true, // 세션 쿠키 자동 전송
});

export const sessionA = async () => {
  
}





export const fetchUsers = async () => {
  let res:any = 'ng'
  try {
    const { data } = await clientApi.get<any>('/users/auth-users');
    res = data
  } catch (err) {
    res = 'logout'
    console.error(err)
  }
  return res
};

