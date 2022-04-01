let s:ascii = ''
let s:unicode = ''

function! gin#component#traffic#ascii(...) abort
  let cwd = a:0 ? a:1 : ''
  call timer_start(0, { -> s:update_ascii(cwd) })
  return s:ascii
endfunction

function! gin#component#traffic#unicode(...) abort
  let cwd = a:0 ? a:1 : ''
  call timer_start(0, { -> s:update_unicode(cwd) })
  return s:unicode
endfunction

function! s:update_ascii(cwd) abort
  try
    let s:ascii = denops#request('gin', 'component:traffic:ascii', [a:cwd])
  catch
    let s:ascii = ''
  endtry
  call gin#util#debounce('doautocmd <nomodeline> User GinComponentPost')
endfunction

function! s:update_unicode(cwd) abort
  try
    let s:unicode = denops#request('gin', 'component:traffic:unicode', [a:cwd])
  catch
    let s:unicode = ''
  endtry
  call gin#util#debounce('doautocmd <nomodeline> User GinComponentPost')
endfunction
