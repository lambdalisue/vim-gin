let s:debounce_timers = {}

function! gin#internal#util#debounce(expr, delay) abort
  let timer = get(s:debounce_timers, a:expr, 0)
  silent! call timer_stop(timer)
  let s:debounce_timers[a:expr] = timer_start(a:delay, { -> execute(a:expr) })
endfunction

" Inherit highlight attributes from a source group and apply additional attributes
" @param target_group The name of the target highlight group
" @param source_group The name of the source highlight group to inherit from
" @param extra_attrs Dictionary with additional attributes (e.g., {'gui': 'strikethrough', 'cterm': 'strikethrough'})
function! gin#internal#util#highlight_inherit(target_group, source_group, extra_attrs) abort
  let source_hl = execute('highlight ' . a:source_group)
  let guifg = matchstr(source_hl, 'guifg=\zs\S\+')
  let guibg = matchstr(source_hl, 'guibg=\zs\S\+')
  let ctermfg = matchstr(source_hl, 'ctermfg=\zs\S\+')
  let ctermbg = matchstr(source_hl, 'ctermbg=\zs\S\+')

  let hl_cmd = 'highlight ' . a:target_group
  if has_key(a:extra_attrs, 'gui') | let hl_cmd .= ' gui=' . a:extra_attrs.gui | endif
  if has_key(a:extra_attrs, 'cterm') | let hl_cmd .= ' cterm=' . a:extra_attrs.cterm | endif
  if !empty(guifg) | let hl_cmd .= ' guifg=' . guifg | endif
  if !empty(guibg) | let hl_cmd .= ' guibg=' . guibg | endif
  if !empty(ctermfg) | let hl_cmd .= ' ctermfg=' . ctermfg | endif
  if !empty(ctermbg) | let hl_cmd .= ' ctermbg=' . ctermbg | endif

  execute hl_cmd
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
