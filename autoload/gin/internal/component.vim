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
    execute printf('autocmd User DenopsPluginPost:gin call gin#internal#component#update("%s")', a:component)
  augroup END
endfunction

function! gin#internal#component#get(component) abort
  return get(s:cache, a:component, '')
endfunction

function! gin#internal#component#update(component) abort
  let previous = get(s:cache, a:component, '')
  call denops#request_async(
        \ 'gin',
        \ a:component,
        \ [],
        \ { v -> s:update_success(a:component, previous, v) },
        \ { e -> s:update_fail(e) },
        \)
endfunction

function! s:update_success(component, previous, value) abort
  let s:cache[a:component] = a:value
  if a:value !=# a:previous
    call gin#util#debounce('doautocmd <nomodeline> User GinComponentPost', 100)
  endif
endfunction

function! s:update_fail(err) abort
  if &verbose
    echoerr a:err
  endif
endfunction
