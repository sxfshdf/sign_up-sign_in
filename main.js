let $form = $('#signUpForm')
$form.on('submit',(e)=>{
  e.preventDefault()
  let hash = {}
  let need = ['email','password','password_confirmation']
  need.forEach((name)=>{
    let value = $form.find(`[name=${name}]`).val()
    hash[name] = value
  })
  console.log(hash)
  $form.find('.error').each((index,span) => {
    $(span).text('')
  })
  if(hash['email'] === ''){
    $form.find('[name = "email"]').siblings('.error').text('请填写邮箱')
    return
  }
  if(hash['password'] === ''){
    $form.find('[name = "password"]').siblings('.error').text('请填写密码')
    return
  }
  if(hash['password'] !== hash['password_confirmation']){
    $form.find('[name="password_confirmation"]').siblings('.error').text('密码不匹配')
  }
  $.post('/sign_up',hash).then(
    ()=>{
      console.log('success')
    },(request)=>{
      // let {errors} = JSON.parse(request.responseText)
      // 在后台设置一个 setHeader('Content-Type','application/json;charset=utf8') 就不需要 JSON.parse()
      let {errors} = request.responseJSON
      if(errors.email && errors.email === 'invalid'){
        $form.find('[name = "email"]').siblings('.error').text('你的邮箱错了')
      }
    })
})
