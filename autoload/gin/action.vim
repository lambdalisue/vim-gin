let s:range_from_call = v:null

function! gin#action#fn(callback) abort
  let range = gin#action#_get_range()
  let xs = gin#action#gather_candidates(range)
  call call(a:callback, [xs])
endfunction

function! gin#action#call(name, range) abort
  let range_saved = s:range_from_call
  let s:range_from_call = a:range
  try
    call feedkeys(printf("\<Plug>(gin-action-%s)\<Ignore>", a:name), 'x')
  finally
    let s:range_from_call = range_saved
  endtry
endfunction

function! gin#action#list_actions() abort
  return denops#request('gin', 'action:list_actions', [])
endfunction

function! gin#action#gather_candidates(range) abort
  return denops#request('gin', 'action:gather_candidates', [a:range])
endfunction

function! gin#action#_get_range() abort
  if s:range_from_call isnot# v:null
    return copy(s:range_from_call)
  endif
  let cursor = line('.')
  if mode() ==# 'n'
    return [cursor, cursor]
  endif
  return sort([cursor, line('v')], 'n')
endfunction
