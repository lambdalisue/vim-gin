if exists('g:loaded_gin_decoration')
  finish
endif
let g:loaded_gin_decoration = 1

if exists('*prop_type_add')
  function! s:init() abort
    for i in range(16)
      call prop_type_add(printf('gin:decoration:decorate:GinColor%d', i), {
            \ 'highlight': printf('GinColor%d', i),
            \ 'combine': v:false,
            \})
    endfor
  endfunction
  call s:init()
endif
