from django import forms
from .models import Usuario
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

class RegistroForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Usuario

        fields = ['first_name','email', 'password1','password2']

    def clean_email(self):

        email = self.cleaned_data.get('email')

        if email:
            email = email.lower()

        return email



class LoginForm(forms.Form):

    email = forms.CharField(widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}))


