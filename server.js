var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery)

if(path === '/style.css'){
  var string = fs.readFileSync('./style.css','utf8')
  response.setHeader('Content-Type','text/css')
  response.write(string)
  response.end()
}else if(path === '/'){
  var string = fs.readFileSync('./index.html','utf8')
  let cookies = request.headers.cookie.split('; ') // 得到 cookies [email=1@qq.com]
  // 遍历 cookies 得到 { sign_in_email: '1@qq.com' }
  let hash = {}
  for(let i=0; i<cookies.length; i++){
    let parts = cookies[i].split('=') // [email,1@qq.com]
    let key = parts[0]
    let value = parts[1]
    hash[key] = value
  }
  // 验证数据库中 email 是否已经存在
  let email = hash.sign_in_email
  let users = fs.readFileSync('./db/users','utf8')
  users = JSON.parse(users)
  let userFound
  for(let i=0; i<users.length; i++){
    if(users[i].email === email){
      userFound = users[i]
      break
    }
  }
  // 存在就提示欢迎登录，不存在就提示不存在
  if(userFound){
    string = string.replace('__hello__','欢迎 ' + userFound.email+' 登录！')
  }else{
    string = string.replace('__hello__','用户不存在')
  }
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write(string)
  response.end()
}else if(path === '/main.js'){
  var string = fs.readFileSync('./main.js','utf8')
  response.setHeader('Content-Type','application/javascript')
  response.write(string)
  response.end()
}else if(path === '/sign_up' && method === 'GET'){
  let string = fs.readFileSync('./sign_up.html','utf-8')
  response.statusCode = 200
  response.setHeader('Content-Type','text/html; charset:utf-8')
  response.write(string)
  response.end()
}else if(path === '/sign_up' && method === 'POST'){
  readBody(request).then((body)=>{
    // body email=1&password=2&password_confirmation=3
    let strings = body.split('&') // ['email=1','password=2','password_confirmation=3']
    let hash = {}
    strings.forEach((string)=>{
      // string  'email=1'
      let parts = string.split('=') // ['email','1']
      let key = parts[0]
      let value = parts[1]
      hash[key] = decodeURIComponent(value) // 需要进行转译，这样 @ 才能正常显示，不然 @ 会显示成 %40
    })
    // let email = hash['email']
    // let password = hash['password']
    // let password_confirmation = hash['password-confirmation']
    let {email, password, password_confirmation} = hash // 等同于上面三句
    if(email.indexOf('@') === -1){ // @ 不存在
      response.statusCode = 400
      response.setHeader('Content-Type','application/json;charset=utf8') 
      response.write(`{
        "errors":{ 
          "email": "invalid"
        }
      }`) 
    }else if(password !== password_confirmation){
      response.statusCode = 400
      response.write('password is not match')
    }else{
      let users = fs.readFileSync('./db/users','utf-8')
    // users可能不符合 JSON 规范，假如代码有问题，那么就直接把 users 变成空数组，要是成功的话就不执行
      try{
        users = JSON.parse(users)
      }catch(exception){
        users = []
      }
    // 判断 email 是否存在，要是存在就不允许再注册。
      let inUse = false
      for( let i = 0; i < users.length; i++){
        let user = users[i]
        if(user.email === email){
          inUse = true
          break
        }
      }
      console.log(inUse)
      if(inUse){
        response.statusCode = 400
        response.write('email in use')
      }else{
        users.push({email: email, password: password})
        let usersString = JSON.stringify(users)
        fs.writeFileSync('./db/users',usersString)
        response.statusCode = 200
      }  
    }
    response.end()
  })
}else if(path === '/sign_in' && method === 'GET'){
  var string = fs.readFileSync('./sign_in.html','utf8')
  response.statusCode = 200
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write(string)
  response.end()
}else if(path === '/sign_in' && method === 'POST'){
  readBody(request).then((body)=>{
    // body email=1&password=2&password_confirmation=3
    let strings = body.split('&') // ['email=1','password=2','password_confirmation=3']
    let hash = {}
    strings.forEach((string)=>{
      // string  'email=1'
      let parts = string.split('=') // ['email','1']
      let key = parts[0]
      let value = parts[1]
      hash[key] = decodeURIComponent(value) // 需要进行转译，这样 @ 才能正常显示，不然 @ 会显示成 %40
    })
    let {email, password} = hash
    let users = fs.readFileSync('./db/users','utf-8')
    try{
      users = JSON.parse(users)
    }catch(exception){
      users = []
    }
    let found
    for( i=0; i<users.length; i++){
      if(users[i].email === email && users[i].password === password){
        found = true
        break
      }
    }
    if(found){
      response.setHeader('Set-Cookie', `sign_in_email = ${email}`) // 设置cookie，对登录用户做一个标记
      response.statusCode = 200
    }else{
      response.statusCode = 400
    }
    
    response.end() 
  })
}else{
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html;charset=utf-8')
  response.write('找不到对应的路径，你需要自行修改 index.js')
  response.end()
}
function readBody(rquest){
  return new Promise((resolve,reject)=>{
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      resolve(body)
    })
  })
}

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


