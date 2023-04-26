import { EventEmitter } from 'events';
import Long from 'long'
import sqlite3 from 'better-sqlite3'

export type Oid = number | Long | string
export type ORef<T extends Obj> = T | Oid
export type Objs<T extends Obj> = T[] | T | null
export type ORefs<T extends Obj> = ORef<T>[] | ORef<T> | null

export type OidGenerator = Generator<Oid, never, Oid>

export function* newOidGenerator(begin: Oid = Long.UZERO): OidGenerator {
    function toLong(oid: Oid): Long {
        if (Long.isLong(oid)) {
            return oid
        } else if (typeof oid === 'string') {
            return Long.fromString(oid, true)
        } else if (typeof oid === 'number') {
            return Long.fromNumber(oid, true)
        } else {
            throw new Error('Type not implemented.');
        }
    }

    let now = toLong(begin)
    while (true) {
        now = now.add(Long.UONE)
        const next = yield now
        if (next !== undefined) {
            now = toLong(next)
        }
    }
}

export type ObjStorage<T extends Obj> = (obj: T) => T

export class ObjStorageRegistry {
    private storages: Map<Function, ObjStorage<Obj>> = new Map()

    public register<T extends Obj>(type: Function, store: ObjStorage<T>) {
        this.storages.set(type, store)
    }

    public get<T extends Obj>(type: Function): ObjStorage<T> {
        const storage = this.storages.get(type)
        if (!storage) {
            throw new Error(`No registered storage for ${type.name}`)
        }
        return storage as ObjStorage<T>
    }
}

export interface Obj {
    oid: Oid | null
}

export interface NamedObj extends Obj {
    name: string
}

export interface TaskObj extends NamedObj {
    dependencies: ORefs<TaskObj>
}

export enum TaskStatus {
    Pending,
    Running,
    Finished,
    Failed
}

class TaskRuntimeObj implements NamedObj {
    oid: Oid | null
    name: string
    parent_oid: Oid | null
    estimate_subtasks
    submit_time: Date
    update_time: Date
    status: TaskStatus
    error: string
}

export type DataBlock = object[]

export type BlockEmitter = (data: DataBlock) => void

export type BlockReceiver = (receiver: (data: DataBlock) => void) => void

export const NullBlockEmitter: BlockEmitter = () => { }

export const NullBlockReceiver: BlockReceiver = () => { }

export interface TaskOperator {
    create(task: TaskObj): void
    start(taskOid: Oid): void
    finish(taskOid: Oid): void
    fail(taskOid: Oid, error: string): void
}

export class TaskRuntime {

    private obj: TaskRuntimeObj
    private storageRegistry: ObjStorageRegistry
    private storeObj: ObjStorage<TaskRuntimeObj>

    public emit: BlockEmitter = NullBlockEmitter
    public receive: BlockReceiver = NullBlockReceiver

    static createRootTaskRuntime(
        storageRegistry: ObjStorageRegistry
    ): TaskRuntime {
        let runtime = new TaskRuntime()
        runtime.storeObj = storageRegistry.get(TaskRuntimeObj)
        runtime.obj = runtime.storeObj({
            oid: null,
            name: '', // TODO
            parent_oid: null,
            estimate_subtasks: '?', // TODO
            submit_time: new Date(),
            update_time: new Date(),
            status: TaskStatus.Running,
            error: '',
        })
        return runtime
    }

    public get<T extends Obj>(type: Function): ObjStorage<T> {
        return this.storageRegistry.get(type)
    }

    public createSubtaskRuntime(): TaskRuntime {
        let runtime = new TaskRuntime()
        runtime.storeObj = this.storeObj
        runtime.obj = this.storeObj({
            oid: null, // TODO
            name: '', // TODO
            parent_oid: this.obj.oid,
            estimate_subtasks: '?', // TODO
            submit_time: new Date(),
            update_time: new Date(),
            status: TaskStatus.Pending,
            error: '',
        })
        return runtime
    }

    public connectSubtaskRuntime(source: TaskRuntime, sink: TaskRuntime) {
        const emitter = new EventEmitter()
        const event = Symbol()
        source.emit = (data: DataBlock) => emitter.emit(event, data)
        sink.receive = (receiver: (data: DataBlock) => void) => emitter.on(event, receiver)
    }
}

export function createTempSqlite3TaskRuntime(): TaskRuntime {
    const db: sqlite3.Database = sqlite3(':memory:');
    db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);
    const insert = db.prepare(`
        INSERT INTO users (name, email, password)
        VALUES (@name, @email, @password);
    `);
    insert.run({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123'
    });

    const a = TaskRuntimeObj
    console.log(a)

    const registry = new ObjStorageRegistry()
    registry.register(TaskRuntimeObj, (obj: TaskRuntimeObj) => {
        if (!obj.oid) {
            obj.oid = oidGenerator.next().value
        }
        // TODO store
        return obj
    })

    const x = registry.get<TaskRuntimeObj>(TaskRuntimeObj);

    const oidGenerator = newOidGenerator()
    const root = TaskRuntime.createRootTaskRuntime((obj: TaskRuntimeObj) => {
        if (!obj.oid) {
            obj.oid = oidGenerator.next().value
        }
        // TODO store
        return obj
    })

    return root
}

export abstract class TaskExecutor {
    // public abstract init(runtime: TaskRuntime): void
    public abstract open(runtime: TaskRuntime): void
    // public abstract close(runtime: TaskRuntime): void
}

export class MainTaskExecutor extends TaskExecutor {
    public open(runtime: TaskRuntime): void {
        throw new Error('Method not implemented.');
    }

}

export interface SqlQueryObj<T extends Obj> extends TaskObj {
    source: T
    sql: string
    args: string[]
}

export class MysqlDatabaseQueryExecutor extends TaskExecutor {
    // private param: SqlQuery<MysqlDatabase>
    public open(runtime: TaskRuntime): void {
        throw new Error('Method not implemented.');
    }
}

export class Sqlite3DatabaseQueryExecutor extends TaskExecutor {
    // private param: SqlQuery<Sqlite3Database>

    private obj: Sqlite3DatabaseObj
    public open(runtime: TaskRuntime): void {
        obj = 
        const conn: sqlite3.Database = sqlite3(this.db);
        const statement = conn.prepare(this.sql);
        const result = statement.all() as object[]
        runtime.emit(result)
    }
}

export interface OptionQueryObj<T extends Obj> extends TaskObj {
    source: T
    option: string
}

export interface BatchInsertObj<T extends Obj> extends TaskObj {
    target: T
    data: DataBlock
}

export interface MysqlConnectionObj extends NamedObj {
    host: string
    port: number | string | null
    username: string
    password: string
}

export interface MysqlDatabaseObj extends NamedObj {
    connection: MysqlConnectionObj
}

export interface Sqlite3DatabaseObj extends NamedObj {
}

// run(task, obj)
// save(store, obj)
// open(store, obj)
// export class SimpleExecutor {
//     private readonly oidGenerator = new OidGenerator()

//     public submitTask(
//         oid: Oid,
//         name: string,
//         promise: Promise<void>,
//     ): Promise<TaskStatus> {

//         async function wrap(): Promise<TaskStatus> {
//             try {
//                 await promise
//                 return {}
//             } catch {
//                 return {}
//             }
//         }
//         return wrap()
//     }
// }
// init
// open
// close

// type = query
// 有sql字段，匹配type = sql query
// source是mysql database数据源，匹配runMysqlDatabaseSqlQuery
// 等前置执行完，将executor，task param传给函数执行
// 查询可能产生很多行，按配置（默认一千）获取结果行，打包成一批数据
// 将这批数据传给下一个任务（任务接口由executor传入）
// export function runMysqlDatabaseSqlQuery(
//     executor: SimpleExecutor,
//     task: SqlQuery<MysqlDatabase>
// ): RunnableTask {
//     // 获取mysql connection
//     // 生成promise，执行mysql查询
//     // 提交promise
//     // 生成task status，存入store
//     // 开始mysql query
//     // 将查询结果分批写入本地临时存储
//     // 每一批写入即生成一个新任务
//     return
// }

//
// export function runMysqlDatabaseInsert(
//     executor: SimpleExecutor,
//     ctx: TaskContext<BatchInsert<MysqlDatabase>>,
// ): RunnableTask {

//     // 建立链接

//     ctx.output.on('', (data: DataBlock) => {
//         // 新建子任务，导入数据
//     })
//     return
// }