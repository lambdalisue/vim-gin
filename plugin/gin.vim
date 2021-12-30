if exists('g:loaded_gin')
  finish
endif
let g:loaded_gin = 1

command! GinStatus echoerr "Gin is not loaded yet"
