if get(g:, 'gin_status_supplement_disable', 0) || exists('b:loaded_gin_status_supplement')
  finish
endif
let b:loaded_gin_status_supplement = 1

function! s:find_value() abort
  let line = line('.')
  try
    let candidates = gin#action#gather_candidates([line, line])
    return candidates[0].value
  catch
    return ''
  endtry
endfunction

function! s:open() abort
  if mode() !=# 'n'
    return
  endif
  let winid = win_getid()
  call denops#plugin#wait_async('gin', { -> s:open_internal(winid) })
endfunction

function! s:open_internal(winid) abort
  let ctx = gin#window#supplement#ctx(a:winid)
  if ctx is# v:null
    return
  endif
  let winid_saved = win_getid()
  try
    call win_gotoid(a:winid)
    let value = s:find_value()
    if value ==# get(t:, 'gin_status_supplement_previous', '')
      return
    endif
    let t:gin_status_supplement_previous = value
    if value ==# ''
      call gin#window#supplement#close_all(ctx)
    else
      " Check if all supplements are opened
      if empty(filter(values(ctx.supplements), { _, v -> v }))
        call gin#window#supplement#close_all(ctx)
        botright split
        call gin#window#supplement#add(ctx, 'index')
        rightbelow vsplit
        call gin#window#supplement#add(ctx, 'worktree')
      endif
      " Update supplement contents
      silent! call win_execute(
            \ ctx.supplements.index,
            \ printf('Gin! ++buffer diff --cached %s', fnameescape(value)),
            \)
      silent! call win_execute(
            \ ctx.supplements.worktree,
            \ printf('Gin! ++buffer diff %s', fnameescape(value)),
            \)
    endif
  finally
    call win_gotoid(winid_saved)
  endtry
endfunction

augroup gin_status_supplement_internal
  autocmd! * <buffer>
  autocmd CursorMoved,CursorHold <buffer> call s:open()
augroup END

call gin#window#supplement#init()
call s:open()
