let s:debounce_timers = {}

function! gin#internal#util#debounce(expr, delay) abort
  let timer = get(s:debounce_timers, a:expr, 0)
  silent! call timer_stop(timer)
  let s:debounce_timers[a:expr] = timer_start(a:delay, { -> execute(a:expr) })
endfunction

function gin#internal#util#input(opts) abort
  return s:input(a:opts)
endfunction

if has('nvim')
  let s:input = function('input')
else
  function s:input(opts) abort
    let l:unique = sha256(reltimestr(reltime()))
    let l:opts = extend(#{
          \ prompt: '',
          \ default: '',
          \ completion: v:null,
          \ cancelreturn: '',
          \}, a:opts)
    try
      execute printf('cnoremap <Esc> <C-u>%s<CR>', l:unique)
      let l:result = l:opts.completion is# v:null
            \ ? input(l:opts.prompt, l:opts.default)
            \ : input(l:opts.prompt, l:opts.default, l:opts.completion)
      if l:result ==# l:unique
        return l:opts.cancelreturn
      endif
      return l:result
    finally
      silent! cunmap <Esc>
    endtry
  endfunction
endif
