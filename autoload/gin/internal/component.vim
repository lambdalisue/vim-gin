let s:cache = {}
let s:init = {}

function! gin#internal#component#init(component) abort
  if has_key(s:init, a:component)
    return
  endif
  let s:init[a:component] = 1
  execute printf('augroup gin_internal_%s', substitute(a:component, '\W', '_', 'g'))
    autocmd!
    execute printf('autocmd BufEnter * call gin#internal#component#update("%s")', a:component)
    execute printf('autocmd User GinCommandPost call gin#internal#component#update("%s")', a:component)
  augroup END
endfunction

function! gin#internal#component#get(component) abort
  return get(s:cache, a:component, '')
endfunction

function! gin#internal#component#update(component) abort
  let previous = get(s:cache, a:component, '')
  try
    let value = denops#request('gin', a:component, [])
  catch
    let value = ''
  endtry
  let s:cache[a:component] = value
  if value !=# previous
    call gin#util#debounce('doautocmd <nomodeline> User GinComponentPost', 100)
  endif
endfunction
