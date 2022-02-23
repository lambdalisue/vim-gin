function! gin#internal#core#action#action#register() abort
  noremap <buffer> <Plug>(gin-action-echo)
        \ <Cmd>call gin#action#fn({ xs -> <SID>echo(xs) })<CR>

  noremap <buffer> <Plug>(gin-action-choice)
        \ <Cmd>call <SID>choice()<CR>

  noremap <buffer> <Plug>(gin-action-repeat)
        \ <Cmd>call <SID>repeat()<CR>

  nnoremap <buffer> <Plug>(gin-action-help)
        \ <Cmd>call <SID>help(v:true)<CR>
  nnoremap <buffer> <Plug>(gin-action-help:all)
        \ <Cmd>call <SID>help(v:false)<CR>
endfunction

function! s:echo(xs) abort
  echo join(map(a:xs, { _, v -> string(v) }), "\n")
endfunction

function! s:choice() abort
  let range = gin#action#_get_range()
  call denops#request('gin', 'action:action:choice', [range])
endfunction

function! s:repeat() abort
  let range = gin#action#_get_range()
  call denops#request('gin', 'action:action:repeat', [range])
endfunction

function! s:help(reduced) abort
  let range = gin#action#_get_range()
  call denops#request('gin', 'action:action:help', [range, a:reduced])
endfunction
