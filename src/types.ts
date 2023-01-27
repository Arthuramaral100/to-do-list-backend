export type TUser = {
    id: string,
    name: string,
    email: string,
    password: string 
}

export type TTask = {
    id: string,
    title: string,
    description: string,
    created_at: string | undefined,
    status: number | undefined
}

export type TUsertask = {
    user_id: string,
    task_id: string
}