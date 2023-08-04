function gin#internal#proxy#init(waiter) abort
  let b:gin_internal_proxy_waiter = a:waiter

  setlocal bufhidden=hide
  setlocal noswapfile

  command! -buffer -nargs=0 Apply call s:apply()
  command! -buffer -nargs=0 Cancel call s:cancel()
  augroup gin_internal_proxy_init
    autocmd! * <buffer>
    autocmd QuitPre <buffer> ++nested ++once call s:confirm(expand('<afile>'))
  augroup END
endfunction

function s:apply() abort
  let l:waiter = b:gin_internal_proxy_waiter
  call s:reset()
  write
  call denops#request('gin', l:waiter, [v:true])
  bwipeout
endfunction

function s:cancel() abort
  let l:waiter = b:gin_internal_proxy_waiter
  call s:reset()
  call denops#request('gin', l:waiter, [v:false])
  bwipeout
endfunction

function s:reset() abort
  augroup gin_internal_proxy_init
    autocmd! * <buffer>
  augroup END
endfunction

function s:confirm(bufnr) abort
  if get(g:, 'gin_proxy_apply_without_confirm', 0)
    call s:apply()
    return
  endif
  echohl Comment
  echo 'Hint: Use `:Apply` or `:Cancel` to apply or cancel changes directly'
  echo 'Hint: Use `let g:gin_proxy_apply_without_confirm = 1` to apply changes without confirmation'
  echohl Title
  try
    let l:result = gin#internal#util#input(#{
          \ prompt: 'Do you want to apply changes? [Y/n] ',
          \ cancelreturn: 'no',
          \})
  finally
    echohl None
  endtry
  redraw
  if l:result ==# '' || l:result =~? '^y\%[es]$'
    call s:apply()
  else
    call s:cancel()
  endif
endfunction
