import { useState, useImperativeHandle, forwardRef } from 'react'
const Toast = forwardRef((props, ref) => {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  useImperativeHandle(ref, () => ({
    fire(text) { setMsg(text); setShow(true); setTimeout(() => setShow(false), 2200) }
  }))
  return <div className={'toast' + (show ? ' show' : '')}>{msg}</div>
})
export default Toast
