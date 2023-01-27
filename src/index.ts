import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'
import {TUser, TTask, TUsertask} from './types'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})


// ... configurações do express

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!"})
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// GET ALL USERS (BUSCA PODE SER FEITA POR QUERY PARAMS)
app.get("/users", async (req: Request, res: Response)=>{
    try {
        const searchTerm = req.query.q as string | undefined

        if(searchTerm === undefined){
            const result = await db("users")
            res.status(200).send(result)
        } else {
            const result: TUser[] = await db("users").where("name", "LIKE", `%${searchTerm}%`)
            res.status(200).send(result)
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// POST USER (CRIAÇÃO DE UM NOVO USER)
app.post("/users", async (req: Request, res: Response)=>{
    try {
        const {id, name, email, password} = req.body

        if (typeof id === "string") {
            if (id[0] !== "f") {
                res.status(400)
                throw new Error("Id deve começar com a letra 'f'");
            } 
            if (id.length < 4) {
                res.status(400)
                throw new Error("Id deve ter no mínimo 4 caracteres.");
            }
        } else {
            res.status(400)
            throw new Error("Id deve ser 'string'.");
            
        }

        
        if (typeof name !== "string") {
            res.status(400)
            throw new Error("'Name' inválido, deve ser string")
        } 
        if (name.length < 2) {
            res.status(400)
            throw new Error("Name deve ter no mínimo 2 caracteres.");
        }
        if (typeof email !== "string") {
            res.status(400)
            throw new Error("'Email' inválido, deve ser string")
        } 
        
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/g)) {
			throw new Error("'Password' deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caractere especial")
		}

        const [ userIdAlreadyExists ]: TUser[] | undefined[] = await db("users").where({ id })

        if (userIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe")
        }

        const [ userEmailAlreadyExists ]: TUser[] | undefined[] = await db("users").where({ email })

        if (userEmailAlreadyExists) {
            res.status(400)
            throw new Error("'email' já existe")
        }
        
        const newUser: TUser = {
            id,
            name, 
            email,
            password
        }

        await db("users").insert(newUser)

        res.status(201).send("User cadastrado com sucesso")

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// DELETE USER (DELETA USER, RECEBENDO ID PARA VERIFICAÇÃO DA EXISTÊNCIA DO USER)
app.delete("/users/:id", async(req: Request, res: Response) =>{
    try {
        const idToDelete = req.params.id
        
        if (idToDelete[0] !== "f") {
            res.status(400)
            throw new Error("Id inválido, deve começar com a letra 'f'");
        }

        const [user]: TUser[] | undefined[] = await db("users").where({id: idToDelete})

        if (user) {
            await db("users_tasks").del().where({user_id: idToDelete})
            await db("users").del().where({id: idToDelete})
        } else{
            res.status(404)
            throw new Error("'id' não encontrado, o user não existe no banco de dados.");
            
        }

        res.status(200).send({ message: "User deletado com sucesso."})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// GET ALL TASKS (BUSCA PODE SER FEITA POR QUERY PARAMS)
app.get("/tasks", async (req: Request, res: Response)=>{
    try {
        const searchTerm = req.query.q as string | undefined

        if ( searchTerm === undefined) {
            const result = await db("tasks")
            res.status(200).send(result)
        } else{
            const result: TTask[] = await db("tasks").where("title", "LIKE", `%${searchTerm}%`).orWhere("description", "LIKE", `%${searchTerm}%`)
            res.status(200).send(result)
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// POST TASK (CRIAÇÃO DE UMA NOVA TASK)
app.post("/tasks", async(req: Request, res: Response) =>{
    try {
        const {id, title, description} = req.body

        if (typeof id === "string") {
            if (id[0] !== "t" ) {
                res.status(400)
                throw new Error("Id inválido, deve começar com letra 't'");
                
            }
        } else {
            res.status(400)
            throw new Error("Id deve ser 'string'.");
            
        }

        if (typeof title !== "string") {
            res.status(400)
            throw new Error("'Title' inválido, deve ser string")
        } 

        if (typeof description !== "string") {
            res.status(400)
            throw new Error("'Description' inválido, deve ser string")
        }

        const [ taskIdAlreadyExists ]: TTask[] | undefined[] = await db("tasks").where({ id })

        if (taskIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe")
        }

        const newTask = {
            id,
            title, 
            description
        }

        await db("tasks").insert(newTask)

        res.status(200).send({message: "Task criada com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// PUT TASK (EDITAR TASK)
app.put("/tasks/:id", async (req: Request, res: Response)=>{
    try {
        const idToUpdate = req.params.id as string

        const newTitle = req.body.title as string
        const newDescription = req.body.description as string 
        const newCreatedAt = req.body.createdAt as string
        const newStatus = req.body.status as number

        if (typeof idToUpdate === "string") {
            if (idToUpdate[0] !== "t") {
                res.status(400)
                throw new Error("Id inválido, deve começar com letra 't'");

            }
        } else{
            res.status(400)
            throw new Error("Id deve ser 'string'");
            
        }

        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("NewTitle deve ser uma 'string'");
            }
        }

        if (newDescription !== undefined) {
            if (typeof newDescription !== "string") {
                res.status(400)
                throw new Error("NewDescription deve ser uma 'string'");
            }
        }

        if (newCreatedAt !== undefined) {
            if (typeof newCreatedAt !== "string") {
                res.status(400)
                throw new Error("NewCreatedAt deve ser uma 'string'");
            }
        }

        if (newStatus !== undefined) {
            if (typeof newStatus !== "number") {
                res.status(400)
                throw new Error("NewStatus deve ser uma 'string'");
            }
        }
        
        const [task] = await db("tasks").where({id: idToUpdate})

        if (!task) {
            res.status(404)
            throw new Error("Id inválido, não encontrado no banco de dados.");
        }

        const newTask = {
            title: newTitle || task.title,
            description: newDescription || task.description,
            created_at: newCreatedAt || task.created_at,
            status: isNaN(newStatus) ? task.status : newStatus
        }

        await db("tasks").update(newTask).where({ id: idToUpdate })

        res.status(200).send({message: "Task editada com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
// DELETE TASK (DELETA TASK, RECEBENDO ID PARA VERIFICAÇÃO DA EXISTÊNCIA DO USER)
app.delete("/tasks/:id", async(req: Request, res: Response) =>{
    try {
        const idToDelete = req.params.id as string
        
        if (idToDelete[0] !== "t") {
            res.status(400)
            throw new Error("Id inválido, deve começar com a letra 't'");
        }

        const [task]: TTask[] = await db("tasks").where({id: idToDelete})

        if (task) {
            await db("tasks").del().where({id: idToDelete})
        } else{
            res.status(404)
            throw new Error("'id' não encontrado, a task não existe no banco de dados.");
            
        }

        res.status(200).send("Task deletada com sucesso.")

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------

app.post("/tasks/:taskId/users/:userId", async(req: Request, res: Response) =>{
    try {
        const taskId = req.params.taskId
        const userId = req.params.userId
        
        if (taskId[0] !== "t") {
            res.status(400)
            throw new Error("TaskId inválido, deve começar com a letra 't'");
        }

        if (userId[0] !== "f") {
            res.status(400)
            throw new Error("userId inválido, deve começar com a letra 'f'");
        }

        const [task]: TTask[] = await db("tasks").where({id: taskId})

        if (!task) {
            res.status(404)
            throw new Error("'task não encontrada'");
            
        }

        const [user]: TTask[] = await db("users").where({id: userId})

        if (!user) {
            res.status(404)
            throw new Error("'user' não encontrada");
            
        }

        const newUserTask: TUsertask = {
            user_id: userId,
            task_id: taskId
        }

        await db("users_tasks").insert(newUserTask)

        res.status(201).send({message: "User atribuido a uma tarefa com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------

app.delete("/tasks/:taskId/users/:userId", async(req: Request, res: Response) =>{
    try {
        const taskIdToDelete = req.params.taskId
        const userIdToDelete = req.params.userId
        
        if (taskIdToDelete[0] !== "t") {
            res.status(400)
            throw new Error("TaskId inválido, deve começar com a letra 't'");
        }

        if (userIdToDelete[0] !== "f") {
            res.status(400)
            throw new Error("userId inválido, deve começar com a letra 'f'");
        }

        const [task]: TTask[] = await db("tasks").where({id: taskIdToDelete})

        if (!task) {
            res.status(404)
            throw new Error("'task não encontrada'");
            
        }

        const [user]: TTask[] = await db("users").where({id: userIdToDelete})

        if (!user) {
            res.status(404)
            throw new Error("'user' não encontrada");
            
        }

        await db("users_tasks").del().where({task_id : taskIdToDelete}).andWhere({user_id : userIdToDelete})

        res.status(200).send({message: "User removido da tarefa com sucesso"})
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------

app.get("/tasks/users", async(req: Request, res: Response) =>{
    try {

        // const result = await db("tasks")
        // .select("tasks.id AS taskId", "title", "description", "created_at AS createdAt", "status", "user_id AS userId", "name", "email", "password")
        // .leftJoin("users_tasks", "users_tasks.task_id", "=", "tasks.id")
        // .leftJoin("users", "users_tasks.user_id", "=", "users.id")
        
        const tasks: TTask[] = await db("tasks")
        
        const result = []

        for(let task of tasks){
            const responsibles = []
            const users_tasks: TUsertask[] = await db("users_tasks").where({task_id: task.id})
            for(let user_task of users_tasks){
                const [user]: TUser[] = await db("users").where({id: user_task.user_id})
                responsibles.push(user)
            }

            result.push({
                ...task,
                responsibles
            })

        }

        res.status(200).send(result)

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// ---------------------------------------------------------------------------------------
