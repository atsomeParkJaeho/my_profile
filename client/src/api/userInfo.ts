import {clientApi} from "./api";



// 회원 조회
export const authUser = async (userId:number) => {
	let res:any = `ng`;
	try {
		let {data} = await clientApi.post(`/auth_user`);
		if(data) {
			res = data;
		}
	} catch (err:any) {
		console.error(err)
		alert(`${err?.message}`)
	}
	return res;
}