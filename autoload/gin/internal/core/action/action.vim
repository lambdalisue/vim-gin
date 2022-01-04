function! gin#internal#core#action#action#register() abort
  noremap <buffer> <Plug>(gin-action-echo)
        \ <Cmd>call gin#action#fn({ xs -> <SID>echo(xs) })<CR>

  noremap <buffer> <Plug>(gin-action-choice)
        \ <Cmd>call <SID>choice()<CR>

  noremap <buffer> <Plug>(gin-action-repeat)
        \ <Cmd>call <SID>repeat()<CR>

  nnoremap <buffer> <Plug>(gin-action-help)
        \ <Cmd>call <SID>help()<CR>

  if !hasmapto('<Plug>(gin-action-choice)')
    map <buffer><nowait> a <Plug>(gin-action-choice)
  endif

  if !hasmapto('<Plug>(gin-action-repeat)')
    map <buffer><nowait> . <Plug>(gin-action-repeat)
  endif

  if !hasmapto('<Plug>(gin-action-help)', 'n')
    nmap <buffer><nowait> ? <Plug>(gin-action-help)
  endif
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

function! s:help() abort
  let range = gin#action#_get_range()
  call denops#request('gin', 'action:action:help', [range])
endfunction
