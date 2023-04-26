import Koa from 'koa'
import KoaBodyparser from 'koa-bodyparser'
import KoaRouter from '@koa/router'

import { Executor } from '@idevdb/core'

const app = new Koa();
const router = new KoaRouter();
const port: number = 3000;

const executor = new Executor()

router.get('/', (ctx, next) => {
    // ctx.router available
    console.log(ctx.request.body)
    console.log(executor.hello())
    
    ctx.body = "hello world！";
});

app
    .use(KoaBodyparser())
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(port, () => {
    console.log(`local: http://127.0.0.1:${port}`)
})

